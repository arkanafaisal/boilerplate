import { RequestHandler, Request, Response, NextFunction } from "express"
import { projectName } from "../configs/env.config.js"
import redis from "../libs/redis.lib.js"


type RateLimitConfig = {
    ttl: number;
    limit: number;
    increaseBy?: number;
}

const rlSchemas = {
    
    'health': { ttl: 1, limit: 60 },

    // --- AUTH ROUTER ---
    'register': { ttl: 60, limit: 9, increaseBy: 2 },
    'login': { ttl: 15, limit: 12, increaseBy: 3 },
    'logout': { ttl: 15, limit: 30 },
    'refresh': { ttl: 15, limit: 60 },
    'verifyEmail': { ttl: 60, limit: 10, increaseBy: 10 },
    'sendResetPasswordLink': { ttl: 60, limit: 5, increaseBy: 5 },
    'verifyResetPassword': { ttl: 60, limit: 10, increaseBy: 10 }, 
    
    // --- USER ROUTER ---
    'getMyProfile': { ttl: 1, limit: 60 },
    'updateUsername': { ttl: 60, limit: 10, increaseBy: 10 },
    'sendEmailVerificationLink': { ttl: 60, limit: 10, increaseBy: 4 }, 
    'updatePassword': { ttl: 60, limit: 10, increaseBy: 4 },
    'deleteMyAccount': { ttl: 60, limit: 10, increaseBy: 10 },

} as const

type rlKey = keyof typeof rlSchemas

export const rl = (key: rlKey): RequestHandler => {
    return async (req, res, next) => {
        if(typeof req.ip === 'undefined'){res.status(400).json({ error: 'no ip' }); return}
        const ip = req.ip

        const config: RateLimitConfig = rlSchemas[key]

        const count = await incrbyRateLimit({ key, ip, ttl: config.ttl, incr: 1})

        if (count > config.limit) {
            res.sendStatus(429)
            return
        }
        res.on('finish', async () => {
            if(res.statusCode >= 200 && res.statusCode < 300 && config.increaseBy){
                await incrbyRateLimit({ key, ip, ttl: config.ttl, incr: config.increaseBy})
            }
        })

        next()
    }
}




export async function incrbyRateLimit({key, ip, ttl, incr}: {key: rlKey, ttl: number, ip: string, incr: number}){
    const redisKey = `${projectName}:rl:${key}:${ip}`

    const count = await redis.eval(
        `
        local current = redis.call("INCRBY", KEYS[1], ARGV[1])
        if current == tonumber(ARGV[1]) then
            redis.call("PEXPIRE", KEYS[1], ARGV[2])
        end
        return current
        `,
        {
            keys: [redisKey],
            arguments: [incr.toString() ,(ttl * 60000).toString()]
        }
    )

    return Number(count)
}