import { Prisma } from "@prisma/client";
import { logger } from "../libs/logger.lib.js"
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({error: "invalid JSON format"})
        return
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientValidationError) {
        if (err instanceof Prisma.PrismaClientValidationError) return res.sendStatus(400)

        switch (err.code) {
            case 'P2002': return res.sendStatus(409)
            // case 'P2025': return res.sendStatus(401)
            // case 'P2003': return res.status(400).json({ message: 'Foreign key constraint failed' })

            default:
                logger.error({
                    code: err.code,
                    message: err.message,
                }, 'postgresql error')
                return res.sendStatus(500)
        }
    }

    if (typeof err === 'object' && err !== null) {
        const message = 'message' in err? String(err.message) : 'No message available';
        const code = 'code' in err? err.code : 'No code available';

        if ('code' in err && typeof code === 'string') {
            if (code.startsWith('ERR_')) logger.error({ code, message }, 'node error')
            if (code.startsWith('ECONN') || code === 'ETIMEDOUT' || code === 'EPIPE') logger.error({ code, message }, 'connection error')
        } else if (
            ('command' in err) || 
            ('type' in err && err.type === 'RedisError') || 
            ('name' in err && err.name === 'ReplyError')
        ){ logger.error({ code, message }, 'redis error') }
        else{
            logger.error({ message, stack: err?.stack?.split('\n')[1] }, 'unknown error')
        }
    } else {
        logger.error({ message: String(err) }, 'unknown error')
    }



    res.sendStatus(500)
    return
};