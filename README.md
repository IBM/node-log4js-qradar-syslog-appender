# node-log4js-syslog-appender
This repo is a syslog appender for node-log4js.

## To install
`npm install git+https://github.ibm.com/org-ids/node-log4js-syslog-appender#v0.1.3 --save`
- Set the following environment variable to enable the appender: `export log4js_syslog_appender_enabled=true`
- *For local deveopment only*: Add the following appender to your log4js.json file:
```
{
        "type": "node-log4js-syslog-appender",
        "options": {
                "host": "localhost",
                "port": "514",
                "certificatePath": "keys/domain.crt",
                "privateKeyPath": "keys/domain.key",
                "passphrase": "",
                "ca": "",
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
export log4js_syslog_appender_host=localhost
export log4js_syslog_appender_port=514
export log4js_syslog_appender_certificatePath=keys/domain.crt
export log4js_syslog_appender_privateKeyPath=keys/domain.key
export log4js_syslog_appender_passphrase=
export log4js_syslog_appender_ca=
export log4js_syslog_appender_facility=local6
export log4js_syslog_appender_tag=
export log4js_syslog_appender_leef=
export log4js_syslog_appender_vendor=IBM
export log4js_syslog_appender_product=otc-api
export log4js_syslog_appender_product_version=1.0
```
- The default behavior is all log messages will be send to syslog, you can override this behavior by
specifying which loggers' log messages to send via the comma separated list env var `log4js_syslog_appender_whitelist`

## Issues
- No tests.
- Message headers may be missing (some form of the formattedMessage function may do this later on).

## Contributions
- Very welcome.
