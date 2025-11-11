import { transports, format } from 'winston';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import { ConfigService } from '@nestjs/config';
const configService = new ConfigService();

/**
 * @description Creates a logger instance with specified configurations for console and file logging.
 * @returns {Logger} A logger instance that writes logs to the console (with verbose level) and to a file (only error logs).
 * @throws {Error} If there is any issue with creating the logger or file transport.
 */
export const LoggerFactory = () => {
  const consoleFormat = format.combine(
    format.timestamp(),
    format.ms(),
    nestWinstonModuleUtilities.format.nestLike(
      configService.get<string>('APP_NAME'),
      {
        colors: true,
        prettyPrint: true,
      },
    ),
  );

  return WinstonModule.createLogger({
    level: 'error',
    transports: [
      new transports.Console({ format: consoleFormat, level: 'verbose' }),
      new transports.File({
        filename: 'logs/error.log',
        level: 'error',
      }),
    ],
  });
};
