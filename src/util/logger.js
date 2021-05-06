import * as Dotenv from 'dotenv';
import winston from 'winston';

Dotenv.config();

const log_level = process.env.LOG_LEVEL || 'error';
// Use JSON logging for log files
// Here winston.format.errors() just seem to work
// because there is no winston.format.simple()
const jsonLogFileFormat = winston.format.combine(
    winston.format.errors({stack: true}),
    winston.format.timestamp(),
    winston.format.prettyPrint(),
);

// Create file loggers
const logger = winston.createLogger({
    level: 'debug',
    format: jsonLogFileFormat,
    expressFormat: true
});

// When running locally, write everything to the console
// with proper stacktraces enabled
if (process.env.NODE_ENV !== 'prod') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.errors({stack: true}),
            winston.format.colorize(),
            winston.format.printf(({level, message, timestamp, stack}) => {
                if (stack) {
                    // print log trace
                    return `${timestamp} ${level}: ${message} - ${stack}`;
                }
                return `${timestamp} ${level}: ${message}`;
            }),
        )
    }));
}
else if (process.env.NODE_ENV == 'prod') {
    logger.add(new winston.transports.File({filename: './log/app.logg', level: log_level, maxsize: 10485760, maxFiles: 3}));
}

export default logger;
