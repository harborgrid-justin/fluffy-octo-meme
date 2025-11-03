// DEVOPS-008: Winston Logging Infrastructure
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
require('dotenv').config();

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our custom colors
winston.addColors(colors);

// Determine the current environment
const env = process.env.NODE_ENV || 'development';
const isDevelopment = env === 'development';

// Define the log level based on environment
const level = () => {
  return isDevelopment ? 'debug' : process.env.LOG_LEVEL || 'info';
};

// Define log format for files (JSON for production)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log format for console (colorized for development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define log directory
const logDir = process.env.LOG_DIR || path.join(__dirname, '../logs');

// Create transports array
const transports = [];

// Console transport (always enabled in development)
if (process.env.LOG_CONSOLE_ENABLED !== 'false' || isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_CONSOLE_LEVEL || level(),
    })
  );
}

// File transport for all logs (rotating)
if (process.env.LOG_FILE_ENABLED === 'true' || !isDevelopment) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: fileFormat,
      level: process.env.LOG_FILE_LEVEL || 'info',
    })
  );
}

// Error file transport (rotating)
if (process.env.LOG_ERROR_FILE_ENABLED === 'true' || !isDevelopment) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      format: fileFormat,
      level: 'error',
    })
  );
}

// HTTP request logs (rotating)
if (!isDevelopment) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'http-%DATE%.log'),
      datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '7d',
      format: fileFormat,
      level: 'http',
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: fileFormat,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileFormat,
    }),
  ],
});

// Add metadata to all logs
const addMetadata = (level, message, metadata = {}) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: env,
    service: process.env.APP_NAME || 'ppbe-backend',
    version: process.env.APP_VERSION || '1.0.0',
    ...metadata,
  };
};

// Enhanced logging methods with metadata support
const enhancedLogger = {
  error: (message, metadata) => logger.error(addMetadata('error', message, metadata)),
  warn: (message, metadata) => logger.warn(addMetadata('warn', message, metadata)),
  info: (message, metadata) => logger.info(addMetadata('info', message, metadata)),
  http: (message, metadata) => logger.http(addMetadata('http', message, metadata)),
  debug: (message, metadata) => logger.debug(addMetadata('debug', message, metadata)),

  // Audit logging for compliance
  audit: (action, userId, resource, metadata = {}) => {
    logger.info(addMetadata('info', 'AUDIT', {
      action,
      userId,
      resource,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },

  // Security event logging
  security: (event, severity, metadata = {}) => {
    logger.warn(addMetadata('warn', 'SECURITY', {
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },

  // Performance logging
  performance: (operation, duration, metadata = {}) => {
    logger.info(addMetadata('info', 'PERFORMANCE', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    }));
  },
};

// Create HTTP request logger middleware
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
    });

    // Log performance warnings for slow requests
    if (duration > 1000) {
      enhancedLogger.performance('Slow request detected', duration, {
        method: req.method,
        url: req.url,
      });
    }
  });

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Express error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next(err);
};

// Create stream for Morgan HTTP logger (if using Morgan)
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = {
  logger: enhancedLogger,
  httpLogger,
  errorLogger,
  stream,
};
