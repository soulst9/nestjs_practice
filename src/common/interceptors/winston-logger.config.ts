import * as winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint(),
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'backend' },
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    // 전체 에러 로그
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    // 전체 로그
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

export const winstonLogger = logger;

// Morgan 설정
export const morganConfig = {
  format: ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
};