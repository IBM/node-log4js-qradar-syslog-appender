/**
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 */
'use strict';

var log4js = require('log4js'),
    syslogConnectionSingleton = require('./syslog-connection-singleton'),
    tls = require('tls'),
    fs = require('fs'),
    util = require('util');


// Configuration for logging
// log4js.configure("./config/log4js.json", {
//     reloadSecs: 30
// });

// var logger = log4js.getLogger('qradar-syslog-appender-lib');


module.exports = {
    appender: appender,
    configure: configure
}

function appender(options) {
    return function(log) {
        if (!syslogConnectionSingleton.connection && !syslogConnectionSingleton.connecting) {
            syslogConnectionSingleton.connecting=true;
            fs.readFile(options.certificatePath, function(err, certificate) {
                if (err) {
                    console.error('Error while loading certificate from path: ' + options.certificatePath + ' Error: ' + JSON.stringify(err, null, 2));
                    return;
                }

                fs.readFile(options.privateKeyPath, function(err, key) {
                    if (err) {
                        console.error('Error while loading private key from path: ' + options.privateKeyPath + ' Error: ' + JSON.stringify(err, null, 2));
                        return;
                    }

                    var tlsOptions = options;
                    delete tlsOptions.certificatePath;
                    delete tlsOptions.privateKeyPath;

                    tlsOptions.cert = certificate;
                    tlsOptions.key = key;

                    syslogConnectionSingleton.connection = tls.connect(tlsOptions, connected.bind(this, log));

                    syslogConnectionSingleton.connection.setEncoding('utf8');
                    syslogConnectionSingleton.connection.on('error', function(err) {
                        console.error('error in connection. Error: ' + JSON.stringify(err, null, 2));
                        syslogConnectionSingleton.connection = null;
                    });
                    syslogConnectionSingleton.connection.on('close', function(err) {
                        console.warn('Connection closed. Error: ' + JSON.stringify(err, null, 2));
                        syslogConnectionSingleton.connection = null;
                    });
                    syslogConnectionSingleton.connection.on('end', function(err) {
                        console.warn('Connection ended. Error: ' + JSON.stringify(err, null, 2));
                        syslogConnectionSingleton.connection = null;
                    });

                });
            });
        } else {
            logMessage(log);
        }
    }
};

function connected(message) {
    syslogConnectionSingleton.connecting = false;
    logMessage(message);
};

function logMessage(log) {
    if (!syslogConnectionSingleton.connection) {
        return setTimeout(logMessage.bind(this, log), 100);
    }

    var logWhitelist = process.env.log4js_syslog_appender_whitelist;
    var categoriesToSend = logWhitelist && logWhitelist.split(',');

    if (logWhitelist && categoriesToSend.indexOf(log.categoryName) === -1) return;

    var message = log.data.join(' | ');

    syslogConnectionSingleton.connection.write(new Buffer(message, 'utf8'));
}

function formattedMessage(message) {
    return util.format(
        '<%d>%s %s %s[%d]:%s\n',
        '1',
        new Date().toJSON(),
        'localhost',
        'otc-api',
        process.pid,
        message || 'Missing message'
    );
}

function configure(config) {
    if (!process.env.log4js_syslog_appender_enabled) {
        return function() {};
    } else {
        console.log('Syslog appender is enabled');
    }
    
    if (config.appender) {
        log4js.loadAppender(config.appender.type);
        config.actualAppender = log4js.appenderMakers[config.appender.type](config.appender);
    }

    var options = {
        host: process.env.log4js_syslog_appender_host || config.options && config.options.host,
        port: process.env.log4js_syslog_appender_port || config.options && config.options.port,
        certificatePath: process.env.log4js_syslog_appender_certificatePath || config.options && config.options.certificatePath,
        privateKeyPath: process.env.log4js_syslog_appender_privateKeyPath || config.options && config.options.privateKeyPath,
        passphrase: process.env.log4js_syslog_appender_passphrase || config.options && config.options.passphrase,
        ca: process.env.log4js_syslog_appender_ca || config.options && config.options.ca,
        facility: process.env.log4js_syslog_appender_facility || config.options && config.options.facility,
        tag: process.env.log4js_syslog_appender_tag || config.options && config.options.tag,
        leef: process.env.log4js_syslog_appender_leef || config.options && config.options.leef,
        vendor: process.env.log4js_syslog_appender_vendor || config.options && config.options.vendor,
        product: process.env.log4js_syslog_appender_product || config.options && config.options.product,
        product_version: process.env.log4js_syslog_appender_product_version || config.options && config.options.product_version
    };

    return appender(options);
};