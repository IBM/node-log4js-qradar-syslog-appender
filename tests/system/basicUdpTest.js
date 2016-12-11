/**
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 */
 'use strict';

var test = require('tape'),
    syslogd = require('syslogd'),
    log4js = require('log4js'),
    syslogAppender = require('../../');

test('Test message received by syslogd', function(t) {
    t.plan(1);
    var syslog = syslogd(function(info) {
    /*
    info = {
          facility: 7
        , severity: 22
        , tag: 'tag'
        , time: Mon Dec 15 2014 10:58:44 GMT-0800 (PST)
        , hostname: 'hostname'
        , address: '127.0.0.1'
        , family: 'IPv4'
        , port: null
        , size: 39
        , msg: 'info'
    }
    */
        console.log(JSON.stringify(info, null, 2));
        t.ok(info, 'did the message get received?');
        t.end();

        // syslog.server.close(function(err, msg) {
        //     if (err) {
        //         console.log('err: ' + err);
        //     }
        //     console.log('exiting test');
        //     process.exit(0);
        // });
        process.exit(0);
    }).listen(514, function(err) {
        log4js.loadAppender('qradar-syslog-appender', syslogAppender);
        log4js.addAppender(log4js.appenders['qradar-syslog-appender']({
            host: 'localhost',
            port: '514',
            useUdpSyslog: true
        }));
        var logger = log4js.getLogger('');
        logger.info('hai');

    });


});
