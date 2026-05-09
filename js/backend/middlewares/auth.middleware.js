import jwt from 'jsonwebtoken';
import { logger } from '../libs/logger.lib.js'
import { jwtSecret } from '../configs/env.config.js';

export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
        logger.debug('access token missing')
        return res.status(401).json({ error: 'access token missing' })
    }

    const accessToken = authHeader.split(' ')[1]

    try{
        const decoded = jwt.verify(accessToken, jwtSecret)
        req.user = decoded
        next();
    } catch(err){
        if(err.name === 'TokenExpiredError'){return res.status(401).json({ error: 'access token expired' })}
        if(err.name === 'JsonWebTokenError'){
            logger.warn('access token invalid')
            return res.status(401).json({ error: 'access token invalid' })
        }

        logger.error({err}, 'JWT verify error')
        return res.sendStatus(500)
    }      
}

