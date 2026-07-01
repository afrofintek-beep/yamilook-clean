/**
 * Structured logger that replaces raw console.error/warn usage.
 * In production, this can be wired to an external error tracking service.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const LOG_BUFFER: LogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

function createEntry(level: LogLevel, message: string, context?: string, data?: unknown): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
}

function addToBuffer(entry: LogEntry) {
  LOG_BUFFER.push(entry);
  if (LOG_BUFFER.length > MAX_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }
}

/** Whether we're in development mode */
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  debug(message: string, context?: string, data?: unknown) {
    const entry = createEntry('debug', message, context, data);
    addToBuffer(entry);
    if (isDev) {
      console.debug(`[${context || 'app'}]`, message, data ?? '');
    }
  },

  info(message: string, context?: string, data?: unknown) {
    const entry = createEntry('info', message, context, data);
    addToBuffer(entry);
    if (isDev) {
      console.info(`[${context || 'app'}]`, message, data ?? '');
    }
  },

  warn(message: string, context?: string, data?: unknown) {
    const entry = createEntry('warn', message, context, data);
    addToBuffer(entry);
    if (isDev) {
      console.warn(`[${context || 'app'}]`, message, data ?? '');
    }
  },

  error(message: string, context?: string, data?: unknown) {
    const entry = createEntry('error', message, context, data);
    addToBuffer(entry);
    // Always log errors (even in prod, they go to browser devtools for debugging)
    console.error(`[${context || 'app'}]`, message, data ?? '');
  },

  /** Get recent log entries for diagnostics */
  getRecentLogs(count = 50): LogEntry[] {
    return LOG_BUFFER.slice(-count);
  },

  /** Get recent errors only */
  getRecentErrors(count = 20): LogEntry[] {
    return LOG_BUFFER.filter(e => e.level === 'error').slice(-count);
  },
};
