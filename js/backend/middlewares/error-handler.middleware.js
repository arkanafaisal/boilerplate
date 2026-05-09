import { logger } from "../libs/logger.lib.js"

export function errorHandler(err, req, res, next){
    if(err instanceof SyntaxError && err.status === 400 && 'body' in err){return res.status(400).json({error: "invalid JSON format"})}

    switch(classifyError(err)){
        case 'node':
            logger.error({
                code: err.code,
                message: err.message
            }, 'node error')
            break;
        case 'network':
            logger.error({
                code: err.code,
                message: err.message
            }, 'connection error')
            break;
        case 'mysql': 
            if(err.code === 'ER_DUP_ENTRY'){return res.sendStatus(409)}
            logger.error({
                code: err.code,
                message: err.message,
            }, 'database error')
            break;
        case 'redis':
            logger.error({
                code: err.code,
                message: err.message,
            }, 'redis error')
            break;
        case 'unknown':
            logger.error({
                message: err.message,
                stack: err?.stack?.split('\n')[1]
            }, 'unknown error')
            break;
    }


    return res.sendStatus(500)
};


function classifyError(err) {
  const code = err?.code

  if (typeof code === 'string') {
    if (code.startsWith('ER_') || code.startsWith('PROTOCOL_')) return 'mysql'
    if (code.startsWith('ERR_')) return 'node'
    if (code.startsWith('ECONN') || code === 'ETIMEDOUT' || code === 'EPIPE') return 'network'
  }

  if (err?.command || err?.type === 'RedisError' || err?.name === 'ReplyError') return 'redis'

  return 'unknown'
}