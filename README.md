# node-log4js-syslog-appender
This repo is a syslog appender for node-log4js.

## To install
`npm install git+https://github.ibm.com/org-ids/node-log4js-syslog-appender#v0.1.3 --save`
`npm install git+https://github.ibm.com/org-ids/node-log4js-syslog-appender#v0.1.4 --save`
- Set the following environment variable to enable the appender: `export log4js_syslog_appender_enabled=true`
- The default behavior is all log messages will be send to syslog, you can override this behavior by
specifying which loggers' log messages to send via the comma separated list env var `export log4js_syslog_appender_whitelist=audit-logs`
- *For local deveopment only*: Add the following appender to your log4js.json file:
```
{
        "type": "node-log4js-syslog-appender",
        "options": {
                "host": "syslog.prd.ccs.ibmcloud.com",
                "port": "6514",
                "certificatePath": "keys/IDS-crt.pem",
                "privateKeyPath": "keys/IDS-key.pem",
                "passphrase": "",
                "caPath": "keys/ca.pem",
                "facility": "local6",
                "tag": "",
                "leef": "",
                "vendor": "IBM",
                "product": "otc-api",
                "product_version": "1.0"
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
export log4js_syslog_appender_certificatePath=keys/IDS-crt.pem
export log4js_syslog_appender_privateKeyPath=keys/IDS-key.pem
export log4js_syslog_appender_passphrase=
export log4js_syslog_appender_caPath=keys/ca.pem
export log4js_syslog_appender_facility=local6
export log4js_syslog_appender_tag=
export log4js_syslog_appender_leef=
export log4js_syslog_appender_vendor=IBM
export log4js_syslog_appender_product=otc-api
export log4js_syslog_appender_product_version=1.0
```
- Note the certs you need are all attached to the work item here: https://hub.jazz.net/ccm09/resource/itemName/com.ibm.team.workitem.WorkItem/55754

## Issues
- No tests.
- Message headers may be missing (some form of the formattedMessage function may do this later on).

## Contributions
- Contributions are very welcome!
