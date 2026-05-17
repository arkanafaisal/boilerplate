import { RequestHandler } from "express"

import jwt from 'jsonwebtoken';
import { logger } from '../libs/logger.lib.js'
import { jwtSecret } from '../configs/env.config.js';



export const authenticate: RequestHandler = async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        logger.debug('access token missing')
        res.status(401).json({ error: 'access token missing' })
    return
    }

    const accessToken = authHeader.split(' ')[1]

    try{
        const decoded = jwt.verify(accessToken, jwtSecret)
        req.user = { id: Number(decoded.sub) }
        next();
    } catch(err){
        if(err instanceof Error){
            if (err.name === 'TokenExpiredError') {
                res.status(401).json({ error: 'access token expired' })
                return
            }
            if(err.name === 'JsonWebTokenError'){
                logger.warn('access token invalid')
                res.status(401).json({ error: 'access token invalid' })
                return
            }
        }

        logger.error({err}, 'JWT verify error')
            res.sendStatus(500)
            return
        }      
}

