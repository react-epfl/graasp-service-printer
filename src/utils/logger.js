import Winston from 'winston';
import Moment from 'moment';
import WinstonRotate from 'winston-daily-rotate-file';
import { LOGGING_LEVEL } from '../config';

// 20 Dec 2017 00:58:38
const timestamp = () => Moment().format('D MMM YYYY HH:mm:ss');

const datePattern = '.yyyy-MM-dd.log';

const level = LOGGING_LEVEL;

Winston.loggers.add('app', {
  transports: [
    new (Winston.transports.Console)({
      timestamp,
      level,
      name: 'console',
      colorize: true,
      label: 'App',
    }),
    new (WinstonRotate)({
      timestamp,
      level,
      datePattern,
      name: 'log-file',
      filename: 'logs/log',
      json: false,
      label: 'App',
      createTree: true,
    }),
    new (WinstonRotate)({
      name: 'error-file',
      filename: 'logs/error',
      datePattern,
      json: false,
      label: 'App',
      timestamp,
      level: 'error',
      createTree: true,
    }),
  ],
});

// set the default app logger
const logger = Winston.loggers.get('app');

export const stream = {
  write: message => logger.info(message),
};

export default logger;
