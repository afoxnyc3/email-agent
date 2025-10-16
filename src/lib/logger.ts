/**
 * Logging with Winston
 */

import winston from 'winston';
import { PerformanceMetrics } from './types.js';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export class AppLogger {
  private metrics: PerformanceMetrics[] = [];

  info(message: string, meta?: any): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, meta);
  }

  error(message: string, error?: any): void {
    logger.error(message, { error: error?.message || error, stack: error?.stack });
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, meta);
  }

  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    if (this.metrics.length > 1000) this.metrics.shift();
  }
}

export const appLogger = new AppLogger();
