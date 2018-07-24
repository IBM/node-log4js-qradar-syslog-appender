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
    net = require('net');

test('Test message received by tcp server', function(t) {
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

        log4js.configure({ 
            appenders: {
                qradar: {
                    type: 'log4js-qradar-syslog-appender',
                    options: {
                        host: 'localhost',
                        port: '1514',
                        product: 'basic-tcp-test'
                    }
                }
            },
            categories: { default: { appenders: ['qradar'], level: 'debug' } }
        });
        var logger = log4js.getLogger('');
        logger.info('hai');
    });

});
