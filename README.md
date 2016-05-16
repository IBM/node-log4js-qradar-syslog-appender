# node-log4js-syslog-appender
Syslog appender for node-log4js.

## Pre-requisites
- Use https://github.com/nomiddlename/log4js-node for logging
- You must call log4js.config('./path/to/log4js.json') somewhere in your application (as this will cause this appender to initialize)


## To upgrade
- `npm uninstall node-log4js-syslog-appender --save`
- `npm install git+https://github.ibm.com/org-ids/node-log4js-syslog-appender#<latestTag> --save`
- You can find the latestTag here: https://github.ibm.com/org-ids/node-log4js-syslog-appender/releases , something like "v0.1.4"

## To install
`npm install git+https://github.ibm.com/org-ids/node-log4js-syslog-appender#<latestTag> --save`
- Set the following environment variable to true in order to enable the appender: `export log4js_syslog_appender_enabled=true`
- The default behavior is all log messages will be send to syslog, you can override this behavior by
specifying which loggers' log messages to send via the comma separated list env var `export log4js_syslog_appender_whitelist=audit-logs`
- *For local deveopment only*: Add the following appender to your log4js.json file (note this is the minimal valid configuration):
```
{
        "type": "node-log4js-syslog-appender",
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
        "type": "node-log4js-syslog-appender",
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

# There are two ways of setting the certs, either through a path (meaning
# you have to check it into a source control - kind of a nono or 
# by setting the base64 encoded values as env vars - the right way).

# Option 1: Checking them into source control, then specifying the path to them
export log4js_syslog_appender_certificatePath=keys/IDS-crt.pem
export log4js_syslog_appender_privateKeyPath=keys/IDS-key.pem
export log4js_syslog_appender_caPath=keys/ca.pem

# Option 2: A more secure way is actually setting the cert itself as env vars. 
# To shorten the length, we use the base64 encoded values of the certs.
export log4js_syslog_appender_certificateBase64=alkjsdfkalsdjfklasdjflkasjdlfkjsdfKLJFLSKDJF9f34
export log4js_syslog_appender_privateKeyBase64=4545FDSFalkjsdfkalsdjfklasdjflkasjdlfkjsdfKLJFLSKDJF9f34
export log4js_syslog_appender_caBase64=3435F43alkjsdfkalsdjfklasdjflkasjdlfkjsdfKLJFLSKDJF9f34

# Allow connections to servers with self signed certs.  By default, these
# connections will fail.
export log4js_syslog_appender_rejectUnauthorized=false
```
- Note the certs you need are all attached to the work item here: https://hub.jazz.net/ccm09/resource/itemName/com.ibm.team.workitem.WorkItem/55754

## Issues/areas of improvement
- More unit tests

## Contributions
- Contributions are welcome as always. Feel free to submit pull requests. Note that all contributions *must* be submitted through pull requests and have to pass the Travis Status Checks in order for code to be merged into master.
