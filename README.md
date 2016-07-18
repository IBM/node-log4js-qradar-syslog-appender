# IBM Bluemix DevOps Services - node-log4js-syslog-appender

This module is a qradar syslog appender for node-log4js.

Link to [Bluemix Public IDS Experiment](https://new-console.ng.bluemix.net/dashboard/devops).

This is one of hundreds of [IBM Open Source projects at GitHub](http://ibm.github.io).

# License

[The MIT License (MIT)](LICENSE.txt)

# Contributing

Contributions are welcome via Pull Requests. Please submit your very first Pull Request against the [Developer's Certificate of Origin](DCO.txt), adding a line like the following to the end of the file... using your name and email address of course!

Note that all contributions *must* be submitted through pull requests and have to pass the Travis Status Checks in order for code to be merged into master.

Signed-off-by: John Doe <john.doe@example.org>

# Build Status
[[Build Status] (https://travis-ci.org/IBM/node-log4js-qradar-syslog-appender)](https://travis-ci.org/IBM/node-log4js-qradar-syslog-appender)


# Usage

## Pre-requisites
- Use https://github.com/nomiddlename/log4js-node for logging
- You must call log4js.config('./path/to/log4js.json') somewhere in your application (as this will cause this appender to initialize)


## To upgrade
- `npm i log4js-qradar-syslog-appender@latest --save`

## To install
`npm i log4js-qradar-syslog-appender --save`
- Set the following environment variable to true in order to enable the appender: `export log4js_syslog_appender_enabled=true`
- The default behavior is all log messages will be send to syslog, you can override this behavior by
specifying which loggers' log messages to send via the comma separated list env var `export log4js_syslog_appender_whitelist=audit-logs`
- *For local deveopment only*: Add the following appender to your log4js.json file (note this is the minimal valid configuration):
```
{
        "type": "log4js-qradar-syslog-appender",
        "options": {
                "host": "syslog.prd.ccs.ibmcloud.com",
                "port": "6514",
                "certificatePath": "keys/IDS-crt.pem",
                "privateKeyPath": "keys/IDS-key.pem",
                "caPath": "keys/ca.pem",
                "product": "otc-api"
          }
}
```
- For production environment (and in source), only push the following in the log4js.json file:
```
{
        "type": "log4js-qradar-syslog-appender",
        "options": {}
}
```
- Set the following env vars (in pipeline - values depending on your setup/app):
```
export log4js_syslog_appender_enabled=true
export log4js_syslog_appender_whitelist=audit-logs,audit-logs-v2
export log4js_syslog_appender_host=syslog.prd.ccs.ibmcloud.com
export log4js_syslog_appender_port=6514
export log4js_syslog_appender_product=otc-api
```

##Use with default syslog

You can use this appender with any default UDP syslog in unencrypted mode.  The environment setup is very similar to above:

```
export log4js_syslog_appender_enabled=true
export log4js_syslog_appender_useUdpSyslog=true
export log4js_syslog_appender_whitelist=audit-logs,audit-logs-v2
export log4js_syslog_appender_host=localhost
export log4js_syslog_appender_port=514
export log4js_syslog_appender_product=otc-api
```


# Setting Certificates
There are two ways of setting the certs, either through a path (meaning you have to check it into a source control - kind of a nono or by setting the base64 encoded values as env vars - the right way).

## Option 1: Checking them into source control, then specifying the path to them
export log4js_syslog_appender_certificatePath=keys/IDS-crt.pem
export log4js_syslog_appender_privateKeyPath=keys/IDS-key.pem
export log4js_syslog_appender_caPath=keys/ca.pem

## Option 2: A more secure way is actually setting the cert itself as env vars.
Note: To shorten the length, we use the base64 encoded values of the certs.
export log4js_syslog_appender_certificateBase64=zeaalkjsdfkalsdjfkrlasdjflkasjdlfkjsdfKLJFLSKDJF9f34
export log4js_syslog_appender_privateKeyBase64=pop4545FDSFalkjsdfrkalsdjfklasdjflkasjdlfkjsdfKLJFLSKDJF9f34
export log4js_syslog_appender_caBase64=ee3rr435F43alkjsdfkalsdjfklasdjflkasjdlfkjsdfKLJFLSKDJF9f34

## Allow connections to servers with self signed certs.  By default, these connections will fail.
export log4js_syslog_appender_rejectUnauthorized=false
```
- Note the certs you need are all attached to the work item here: https://hub.jazz.net/ccm09/resource/itemName/com.ibm.team.workitem.WorkItem/55754
