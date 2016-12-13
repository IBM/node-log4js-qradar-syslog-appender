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
    log4js = require('log4js'),
    syslogAppender = require('../../'),
    net = require('net');

test('Test boolean useUdpSyslog=false uses Tcp', function(t) {
    t.plan(1);

    var server = net.createServer(function(socket) {
        // 'connection' listener
        console.log('client connected');
        socket.on('end', function() {
            console.log('client disconnected');
        });
        socket.write('hello\r\n');
        socket.pipe(socket);

        socket.on('data', function(data) {
            console.log('received data: ' + data);
            t.ok(data, 'did the message get received over tcp?');
            t.end();
            process.exit(0);
        });

    });
    server.on('error', function(err) {
        throw err;
    });
    server.listen(1514, function(err) {
        if (err) {
            console.log('Error setting up syslog server: ' + JSON.stringify(err, null, 2));
            throw err;
        }
        console.log('server bound on port 1514');

        log4js.loadAppender('qradar-syslog-appender', syslogAppender);
        log4js.addAppender(log4js.appenders['qradar-syslog-appender']({
            host: 'localhost',
            port: '1514',
            useUdpSyslog: false
        }));
        var logger = log4js.getLogger('');
        logger.info('hai');
    });

});
