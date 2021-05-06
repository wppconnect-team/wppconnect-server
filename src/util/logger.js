import * as Dotenv from 'dotenv';
import winston from 'winston';

Dotenv.config();
let loggerInstance;

function getInstance() {
    if (loggerInstance)
        return loggerInstance;
    const consoleTransport = new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.align(),
            winston.format.printf(info => {
                const {timestamp, level, message, ...args} = info;

                const ts = timestamp.slice(0, 19).replace('T', ' ');
                return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
                    }`;
            })
        ),
        level: process.env.LOG_LEVEL,
    });

    const fileTransport = new winston.transports.File({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(info => {
                const {timestamp, level, message, ...args} = info;

                const ts = timestamp.slice(0, 19).replace('T', ' ');
                return `[${ts}] [${level}] - ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
                    }`;
            })
        ),
        filename: './log/app.log',
        level: process.env.LOG_LEVEL,
        maxsize: 10485760,
        maxFiles: 3
    });
    var trans = [];
    if (process.env.NODE_ENV == 'dev')
        trans = [consoleTransport];
    else
        trans = [fileTransport];
    loggerInstance = winston.createLogger({
        transports: trans,
    });
    return loggerInstance;
}


export default getInstance();
