/**
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 */
/*eslint-env node */
'use strict';

var log4js = require('log4js'),
    syslogConnectionSingleton = require('./syslog-connection-singleton'),
    base64Decode = require('./base64-decode'),
    async = require('async'),
    tls = require('tls'),
    fs = require('fs'),
    util = require('util'),
    os = require('os'),
    dgram = require('dgram');

module.exports = {
    appender: appender,
    configure: configure,
    shutdown: shutdown
};

function retryLogic(retryFunction, tries) {
    // we are in circuit break mode. There is something wrong with the qradar connection. We won't try to
    // send any log messages to qradar until the circuit is connected again.
    if (syslogConnectionSingleton.circuitBreak) {
        syslogConnectionSingleton.droppedMessages++;
        return;
    }
    
    // initialize (or increment if already initialized) tries
    if (!tries) {
        tries = 1;
    }
    else {
        tries++;
    }

    if (tries > syslogConnectionSingleton.MAX_TRIES) {
        syslogConnectionSingleton.circuitBreak = true;
        util.log('QRadar Syslog Appender: Tried sending a message ' + syslogConnectionSingleton.MAX_TRIES + 
            ' times but the client was not connected. ' + 
            'Initiating circuit breaker protocol. ' + 
            'For the next ' + syslogConnectionSingleton.CIRCUIT_BREAK_MINS + 
            ' mins, we will not attempt to send any messages to Logmet.');
        // circuit breaker logic - if detected bad connection, stop trying
        // to send log messages to qradar for syslogConnectionSingleton.CIRCUIT_BREAK_MINS.

        syslogConnectionSingleton.droppedMessages++;
        setTimeout(connectCircuit.bind(this), 
            syslogConnectionSingleton.CIRCUIT_BREAK_MINS * 60 * 1000);
        return;
    }
    setTimeout(retryFunction.bind(this, tries), 100);
    return;
};

function connectCircuit() {
    util.log('QRadar Syslog Appender: Re-connecting the circuit. So far we have dropped ' + 
        syslogConnectionSingleton.droppedMessages + ' messages.');
    syslogConnectionSingleton.circuitBreak = false;
};

function readBase64StringOrFile(base64, file, callback) {
    if (base64) {
        callback(null, base64Decode(base64));
    } else if (file) {
        fs.readFile(file, {'encoding': 'utf8'}, function(err, fileContent) {
            if (err) {
                return callback('Error while loading file: ' + file + ' Error: ' + JSON.stringify(err, null, 2));
            }
            return callback(null, fileContent);
        });
    }
    else {
        callback();  
    } 
};

function loggingFunction(options, log, tries) {
    if (syslogConnectionSingleton.shutdown) {
        return;
    }
    // we are in circuit break mode. There is something wrong with the qradar connection. We won't try to
    // send any log messages to qradar until the circuit is connected again.
    if (syslogConnectionSingleton.circuitBreak) {
        syslogConnectionSingleton.droppedMessages++;
        return;
    }

    if (!syslogConnectionSingleton.connection && !syslogConnectionSingleton.connecting) {
        syslogConnectionSingleton.connecting = true;
        if (options.useUdpSyslog) {
            var client = dgram.createSocket('udp4');
            syslogConnectionSingleton.connection = {
                write: function (msg) {
                    client.send(msg, 0, msg.length, options.port, options.host, function (err) {
                        if (err && err !== 0) {
                            cleanupConnection(err, 'error');
                            retryLogic(loggingFunction.bind(this, options, log), tries);
                        }
                    });
                },
                destroy: function() {
                    client.close();
                }
            };
            client.on('error', function(err) {
                cleanupConnection(err, 'error');
                retryLogic(loggingFunction.bind(this, options, log), tries);
            });
            syslogConnectionSingleton.connecting = false;
            logMessage(log, options, tries);
        } else {

            // set up mutual auth.
            async.parallel({
                'certificate': readBase64StringOrFile.bind(this, options.certificateBase64, options.certificatePath),
                'key': readBase64StringOrFile.bind(this, options.privateKeyBase64, options.privateKeyPath),
                'caCert': readBase64StringOrFile.bind(this, options.caBase64, options.caPath)
            },
            function(err, results) {
                if (err) {
                    console.error(err);
                    return;
                }

                var tlsOptions = {
                    cert: results.certificate,
                    key: results.key,
                    ca: results.caCert,
                    host: options.host,
                    port: options.port,
                    passphrase: options.passphrase,
                    facility: options.facility,
                    tag: options.tag,
                    leef: options.leef,
                    vendor: options.vendor,
                    product: options.product,
                    product_version: options.product_version,
                    rejectUnauthorized: options.rejectUnauthorized
                };

                syslogConnectionSingleton.connection = tls.connect(tlsOptions, connected.bind(this, log, options, tries));

                syslogConnectionSingleton.connection.setEncoding('utf8');
                syslogConnectionSingleton.connection.on('error', function(err) {
                    cleanupConnection(err, 'error');
                    retryLogic(loggingFunction.bind(this, options, log), tries);
                });
                syslogConnectionSingleton.connection.on('close', function(err) {
                    cleanupConnection(err, 'closed');
                    retryLogic(loggingFunction.bind(this, options, log), tries);
                });
                syslogConnectionSingleton.connection.on('end', function(err) {
                    cleanupConnection(err, 'ended');
                    retryLogic(loggingFunction.bind(this, options, log), tries);
                });
            });
        }
    } else if (syslogConnectionSingleton.connecting) {
        syslogConnectionSingleton.droppedMessages++;
    } else {
        logMessage(log, options, tries);
    }
};

function cleanupConnection(err, type) {
    console.warn('QRadar Syslog appender: connection ' + type + '. Error: ' + JSON.stringify(err, null, 2));
    if (syslogConnectionSingleton.connection) {
        syslogConnectionSingleton.connection.destroy();
        syslogConnectionSingleton.connection = null;
    }
    syslogConnectionSingleton.connecting = false;
};

function appender(options) {
    return loggingFunction.bind(this, options);
};

function connected(message, options, tries) {
    syslogConnectionSingleton.connecting = false;
    console.warn('QRadar Syslog appender: we have (re)connected to QRadar using a secure connection with ' +
        (syslogConnectionSingleton.connection.authorized ? 'a valid ' : 'an INVALID ') +
        'peer certificate. ' + syslogConnectionSingleton.droppedMessages + ' messages have been dropped.');
    logMessage(message, options, tries);
};

function logMessage(log, options, tries) {
    // we are in circuit break mode. There is something wrong with the qradar connection. We won't try to
    // send any log messages to qradar until the circuit is connected again.
    if (syslogConnectionSingleton.circuitBreak) {
        syslogConnectionSingleton.droppedMessages++;
        return;
    }

    // we got disconnected. Try to reconnect
    if (!syslogConnectionSingleton.connection) {
        return retryLogic(loggingFunction.bind(this, options, log), tries);
    }

    // if theres a whitelist then only send those messages
    var logWhitelist = process.env.log4js_syslog_appender_whitelist;
    var categoriesToSend = logWhitelist && logWhitelist.split(',');
    if (logWhitelist && categoriesToSend.indexOf(log.categoryName) === -1) return;

    var formattedMessage = formatMessage(log.data.join(' | '), log.level && log.level.levelStr, options);

    syslogConnectionSingleton.connection.write(formattedMessage);
};

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
};

function formatMessage(message, levelStr, options) {
    // format as:
    // HEADER STRUCTURED_DATA MESSAGE
    // where HEADER = <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID
    // for details see the RFC here http://tools.ietf.org/html/rfc5424# .
    return util.format(
        '<%d>%d %s %s %s %d %s %s %s\n',
        16*8+levelToSeverity(levelStr), // hardcoded facility of local0 which translates to 16 according to RFC. TODO: use passed in facility.
        1,
        new Date().toJSON(),
        options.url,
        options.product,
        process.pid,
        '-', 
        '-',
        message || '{}'
    );
};

function configure(config) {
    if (process.env.log4js_syslog_appender_enabled !== 'true') {
        return function() {};
    } else {
        if (config.appender) {
            log4js.loadAppender(config.appender.type);
            config.actualAppender = log4js.appenderMakers[config.appender.type](config.appender);
        }

        var options = {
            host: process.env.log4js_syslog_appender_host || config.options && config.options.host,
            port: process.env.log4js_syslog_appender_port || config.options && config.options.port,
            useUdpSyslog: process.env.log4js_syslog_appender_useUdpSyslog !== undefined ? process.env.log4js_syslog_appender_useUdpSyslog : config.options && config.options.useUdpSyslog,
            certificatePath: process.env.log4js_syslog_appender_certificatePath || config.options && config.options.certificatePath,
            privateKeyPath: process.env.log4js_syslog_appender_privateKeyPath || config.options && config.options.privateKeyPath,
            passphrase: process.env.log4js_syslog_appender_passphrase || config.options && config.options.passphrase || '',
            caPath: process.env.log4js_syslog_appender_caPath || config.options && config.options.caPath,
            certificateBase64: process.env.log4js_syslog_appender_certificateBase64 || config.options && config.options.certificateBase64,
            privateKeyBase64: process.env.log4js_syslog_appender_privateKeyBase64 || config.options && config.options.privateKeyBase64,
            caBase64: process.env.log4js_syslog_appender_caBase64 || config.options && config.options.caBase64,
            facility: process.env.log4js_syslog_appender_facility || config.options && config.options.facility || '',
            tag: process.env.log4js_syslog_appender_tag || config.options && config.options.tag || '',
            leef: process.env.log4js_syslog_appender_leef || config.options && config.options.leef || '',
            vendor: process.env.log4js_syslog_appender_vendor || config.options && config.options.vendor || '',
            product: process.env.log4js_syslog_appender_product || config.options && config.options.product,
            product_version: process.env.log4js_syslog_appender_product_version || config.options && config.options.product_version || '',
            rejectUnauthorized: process.env.log4js_syslog_appender_rejectUnauthorized !== undefined ? process.env.log4js_syslog_appender_rejectUnauthorized : config.options && config.options.rejectUnauthorized,
            url: process.env.log4js_syslog_appender_url || config.options && config.options.url || process.env.url || os.hostname() || ''
        };

        var stripOut = ['https://', 'http://'];
        for (var i = 0; i < stripOut.length; i++) {
            if (options.url.startsWith(stripOut[i])) {
                options.url = options.url.slice(stripOut[i].length);
            }
        }

        // make sure boolean flags work properly with string inputs
        options.useUdpSyslog = options.useUdpSyslog === 'true' || options.useUdpSyslog === true // default is false
        options.rejectUnauthorized = options.rejectUnauthorized !== 'false' && options.rejectUnauthorized !== false // default is true

        if (!verifyOptions(options)) {
            return function() {};
        }
        util.log('Syslog appender is enabled');
        syslogConnectionSingleton.shutdown = false;
        return appender(options);
    }
};

function verifyOptions(options) {
    var requiredOptions = [
        'log4js_syslog_appender_host',
        'log4js_syslog_appender_port',
        'log4js_syslog_appender_product'
    ];
    var valid = true;

    requiredOptions.forEach(function(option) {
        var key = option.substring(option.lastIndexOf('_')+1);
        if (!options[key]) {
            util.log('QRadar node-log4js-syslog-appender: ' + key + ' is a required option. It is settable with the ' + option + ' environment variable.');
            valid = false; // array.forEach is blocking
        }
    });


    [ 
        'log4js_syslog_appender_certificate',
        'log4js_syslog_appender_privateKey',
        'log4js_syslog_appender_ca',
    ].forEach(function (option) {
        var key = option.split('_').pop();

        if (!options[key + "Path"] && !options[key + "Base64"] && !options.useUdpSyslog) {
            util.log('QRadar node-log4js-syslog-appender: Either ' + key + 'Path or ' + key + 'Base64 are required options. It is settable with the ' + option + ' environment variable.');
            valid = false; // array.forEach is blocking
        }

        // Deprecated warnings.
        if (options[key + "Path"]) {
            if (options.useUdpSyslog) {
                util.log('QRadar node-log4js-syslog-appender: WARNING env var ' +
                    key + 'Path will not be used for unencrypted syslog UDP/514.');
            } else {
                util.log('QRadar node-log4js-syslog-appender: WARNING env var ' +
                    key + 'Path is now deprecated and will be removed in a future' +
                    ' relase. Please switch to ' + key + 'Base64 instead.');
            }
        }
        if (options[key + "Base64"] && options.useUdpSyslog) {
            util.log('QRadar node-log4js-syslog-appender: WARNING env var ' +
                key + 'Base64 will not be used for unencrypted syslog UDP/514.');
        }
    })

    return valid;
};

function shutdown(callback) {
    syslogConnectionSingleton.shutdown = true;
    cleanupConnection('log4js is shutting down', 'shutting down');
    callback();
}
