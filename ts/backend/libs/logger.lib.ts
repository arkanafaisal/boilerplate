import pino from 'pino'
import { isDev, logLevel } from '../configs/env.config.js'


export const logger = pino({
  level: logLevel || 'info',
  base: isDev
    ? null
    : undefined,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    : undefined
})