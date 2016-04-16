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
    util = require('util'),
    os = require('os');


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

                    fs.readFile(options.caPath, function(err, caCert) {
                        if (err) {
                            console.error('Error while loading ca key from path: ' + options.caPath + ' Error: ' + JSON.stringify(err, null, 2));
                            return;
                        }

                        var tlsOptions = options;
                        delete tlsOptions.certificatePath;
                        delete tlsOptions.privateKeyPath;
                        delete tlsOptions.caPath;

                        tlsOptions.cert = certificate;
                        tlsOptions.key = key;
                        tlsOptions.ca = caCert;

                        syslogConnectionSingleton.connection = tls.connect(tlsOptions, connected.bind(this, log, options));

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
            });
        } else {
            logMessage(log, options);
        }
    }
};

function connected(message, options) {
    syslogConnectionSingleton.connecting = false;
    logMessage(message, options);
};

function logMessage(log, options) {
    if (!syslogConnectionSingleton.connection) {
        return setTimeout(logMessage.bind(this, log, options), 100);
    }

    var logWhitelist = process.env.log4js_syslog_appender_whitelist;
    var categoriesToSend = logWhitelist && logWhitelist.split(',');

    if (logWhitelist && categoriesToSend.indexOf(log.categoryName) === -1) return;

    var formattedMessage = formatMessage(log.data.join(' | '), log.level && log.level.levelStr, options);

    syslogConnectionSingleton.connection.write(formattedMessage);
}

function levelToSeverity(levelStr) {
    var levels = [
        'FATAL',
        'ERROR',
        'WARN',
        'INFO',
        'DEBUG',
        'TRACE'
    ];

    return levels.indexOf(levelStr) !== -1 ? levels.indexOf(levelStr) + 1 : 4;
}

function formatMessage(message, levelStr, options) {
    // format as:
    // HEADER STRUCTURED_DATA MESSAGE
    // where HEADER = <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID
    // for details see the RFC here http://tools.ietf.org/html/rfc5424# .
    return util.format(
        '<%d>%d %s %s %s %d %s %s %s\n',
        22*8+levelToSeverity(levelStr),
        1,
        new Date().toJSON(),
        process.env.url || os.hostname(),
        options.product || process.env.NEW_RELIC_APP_NAME || 'node-log4js-syslog-appender-consumer',
        process.pid,
        '-', 
        '-',
        message || '{}'
    );
}

function configure(config) {
    if (process.env.log4js_syslog_appender_enabled !== 'true') {
        return function() {};
    } else {
        util.log('Syslog appender is enabled');
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
        caPath: process.env.log4js_syslog_appender_caPath || config.options && config.options.caPath,
        facility: process.env.log4js_syslog_appender_facility || config.options && config.options.facility,
        tag: process.env.log4js_syslog_appender_tag || config.options && config.options.tag,
        leef: process.env.log4js_syslog_appender_leef || config.options && config.options.leef,
        vendor: process.env.log4js_syslog_appender_vendor || config.options && config.options.vendor,
        product: process.env.log4js_syslog_appender_product || config.options && config.options.product,
        product_version: process.env.log4js_syslog_appender_product_version || config.options && config.options.product_version
    };

    return appender(options);
};