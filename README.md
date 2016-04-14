# node-log4js-syslog-appender
This repo is a syslog appender for node-log4js.

## To install
npm install git+https://github.ibm.com/hermanba/node-log4js-syslog-appender#0.0.1 --save
Add the following appender to your log4js.json file:
```
{
            "type": "qradar-syslog-appender",
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
## Issues
- No re-connection attempts on connection error, close or ending. 
- No tests.
- Message headers may be missing (some form of the formattedMessage function may do this later on).

## Contributions
- Very welcome.
