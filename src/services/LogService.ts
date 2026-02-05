import { isTauri } from '@tauri-apps/api/core';
import {
  debug as logDebug,
  error as logError,
  info as logInfo,
  trace as logTrace,
  warn as logWarn,
} from '@tauri-apps/plugin-log';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

type PluginLogger = (message: string) => Promise<void>;

const CONSOLE_METHODS: Record<LogLevel, (...args: unknown[]) => void> = {
  trace: console.debug,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

/**
 * LogService centralises log forwarding so callers can safely pass arbitrary values.
 * It mirrors the console levels we expose through the Tauri log bridge.
 */
export class LogService {
  private static readonly CIRCULAR_REF_PLACEHOLDER = '[Circular]';

  private static formatArgs(args: unknown[]): string {
    if (args.length === 0) {
      return '';
    }

    return args
      .map((value) => {
        if (value instanceof Error) {
          const errorParts = [`${value.name}: ${value.message}`];
          if (value.stack) {
            errorParts.push(value.stack);
          }
          return errorParts.join('\n');
        }

        if (typeof value === 'string') {
          return value;
        }

        if (
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          typeof value === 'bigint' ||
          typeof value === 'symbol'
        ) {
          return String(value);
        }

        if (typeof value === 'function') {
          return value.name ? `[Function: ${value.name}]` : '[Function]';
        }

        if (typeof value === 'undefined' || value === null) {
          return String(value);
        }

        return LogService.safeStringify(value);
      })
      .join(' ');
  }

  private static safeStringify(value: unknown): string {
    const cache = new WeakSet<object>();

    try {
      return JSON.stringify(value, (_, nestedValue) => {
        if (typeof nestedValue === 'bigint') {
          return nestedValue.toString();
        }

        if (typeof nestedValue === 'object' && nestedValue !== null) {
          if (cache.has(nestedValue as object)) {
            return LogService.CIRCULAR_REF_PLACEHOLDER;
          }
          cache.add(nestedValue as object);
        }

        return nestedValue as unknown;
      });
    } catch (err) {
      return `[Unserializable: ${String(err)}]`;
    }
  }

  private static async forward(
    level: LogLevel,
    pluginLogger: PluginLogger,
    args: unknown[]
  ): Promise<void> {
    const message = LogService.formatArgs(args);

    if (!isTauri()) {
      CONSOLE_METHODS[level](`[${level.toUpperCase()}]`, ...args);
      return;
    }

    try {
      await pluginLogger(message);
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        // Fall back to the native console in development so the failure is visible.
        console.error(`[LogService] Failed to forward ${level} log`, err);
      }
    }
  }

  public static trace(...args: unknown[]): Promise<void> {
    return LogService.forward('trace', logTrace, args);
  }

  public static debug(...args: unknown[]): Promise<void> {
    return LogService.forward('debug', logDebug, args);
  }

  public static info(...args: unknown[]): Promise<void> {
    return LogService.forward('info', logInfo, args);
  }

  public static warn(...args: unknown[]): Promise<void> {
    return LogService.forward('warn', logWarn, args);
  }

  public static error(...args: unknown[]): Promise<void> {
    return LogService.forward('error', logError, args);
  }
}

export default LogService;
