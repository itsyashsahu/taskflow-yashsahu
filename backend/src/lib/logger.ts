import pino from "pino";
import type { Logger } from "pino";
import { randomUUID } from "crypto";

export const baseLog = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  base: undefined,
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

const requestLoggers = new Map<string, Logger>();

let currentRequestId: string | null = null;

export const setCurrentRequestId = (id: string) => {
  currentRequestId = id;
};

export const getRequestLogger = (requestId?: string) => {
  const id = requestId || currentRequestId;
  if (!id) return baseLog;
  
  if (!requestLoggers.has(id)) {
    const requestLogger = baseLog.child({
      requestId: id,
    });
    requestLoggers.set(id, requestLogger);
  }
  return requestLoggers.get(id)!;
};

class ConsoleLogger {
  private getReqLog() {
    return getRequestLogger();
  }

  info(message: string, ...args: any[]) {
    this.getReqLog().info(message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.getReqLog().warn(message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.getReqLog().error(message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.getReqLog().debug(message, ...args);
  }

  log(message: string, ...args: any[]) {
    this.getReqLog().info(message, ...args);
  }
}

export const reqLog = new ConsoleLogger();

export const log = {
  info: (msg: string, ...args: any[]) => baseLog.info(msg, ...args),
  warn: (msg: string, ...args: any[]) => baseLog.warn(msg, ...args),
  error: (msg: string, ...args: any[]) => baseLog.error(msg, ...args),
  debug: (msg: string, ...args: any[]) => baseLog.debug(msg, ...args),
};

Object.assign(console, {
  log: log.info,
  warn: log.warn,
  error: log.error,
  debug: log.debug,
});