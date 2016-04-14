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
        if (!syslogConnectionSingleton.connection) {
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

                    syslogConnectionSingleton.connection = tls.connect(tlsOptions, logMessage.bind(this, log));
                    syslogConnectionSingleton.connection.setEncoding('utf8');
                    syslogConnectionSingleton.connection.on('error', function(err) {
                        console.error('error in connection. Error: ' + JSON.stringify(err, null, 2));
                    });
                    syslogConnectionSingleton.connection.on('close', function(err) {
                        console.warn('Connection closed. Error: ' + JSON.stringify(err, null, 2));
                    });
                    syslogConnectionSingleton.connection.on('end', function(err) {
                        console.warn('Connection ended. Error: ' + JSON.stringify(err, null, 2));
                    });

                });
            });
        } else {
            logMessage(log);
        }
    }
};

function logMessage(log) {
    if (log.categoryName !== 'audit-logs') return;

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

    if (config.appender) {
        log4js.loadAppender(config.appender.type);
        config.actualAppender = log4js.appenderMakers[config.appender.type](config.appender);
    }

    return appender(config.options);
};