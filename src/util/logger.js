import {config} from './sessionUtil';
import winston from 'winston';

const log_level = config.log.level;
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
if (config.log.logger.indexOf('console') > -1) {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.errors({stack: true}),
            winston.format.colorize(),
            winston.format.printf(({level, message, timestamp, stack}) => {
                if (stack) {
                    // print log trace
                    return `${level}: ${timestamp} ${message} - ${stack}`;
                }
                return `${level}: ${timestamp} ${message}`;
            }),
        )
    }));
}
if (config.log.logger.indexOf('file') > -1) {
    logger.add(new winston.transports.File({filename: './log/app.logg', level: log_level, maxsize: 10485760, maxFiles: 3}));
}

export default logger;
