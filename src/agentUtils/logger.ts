/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ILogObj } from 'tslog';

import { LogLevel, BaseLogger } from '@credo-ts/core';
import { appendFileSync } from 'fs';
import { Logger } from 'tslog';

function logToTransport(logObject: ILogObj) {
  appendFileSync('logs.txt', JSON.stringify(logObject) + '\n');
}

export class TsLogger extends BaseLogger {
  private logger: Logger<ILogObj>;

  // Map our log levels to tslog numerical levels
  private tsLogLevelMap = {
    [LogLevel.test]: 0, // Corresponding to "silly"
    [LogLevel.trace]: 1, // "trace"
    [LogLevel.debug]: 2, // "debug"
    [LogLevel.info]: 3, // "info"
    [LogLevel.warn]: 4, // "warn"
    [LogLevel.error]: 5, // "error"
    [LogLevel.fatal]: 6, // "fatal"
  } as const;

  public constructor(logLevel: LogLevel, name?: string) {
    super(logLevel);

    // Initialize the tslog logger
    this.logger = new Logger<ILogObj>({
      name,
      minLevel:
        this.logLevel === LogLevel.off
          ? undefined
          : this.tsLogLevelMap[this.logLevel],
      // ignoreStackLevels: 5,
      attachedTransports: [
        (logObject) => {
          logToTransport(logObject);
        },
      ],
    });
  }
  private log(
    level: Exclude<LogLevel, LogLevel.off>,
    message: string,
    data?: Record<string, any>,
  ): void {
    const tsLogLevel = this.tsLogLevelMap[level];

    if (data) {
      this.logger.log(tsLogLevel, message, data);
    } else {
      this.logger.log(tsLogLevel, message);
    }
  }

  public test(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.test, message, data);
  }

  public trace(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.trace, message, data);
  }

  public debug(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.debug, message, data);
  }

  public info(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.info, message, data);
  }

  public warn(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.warn, message, data);
  }

  public error(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.error, message, data);
  }

  public fatal(message: string, data?: Record<string, any>): void {
    this.log(LogLevel.fatal, message, data);
  }
}
