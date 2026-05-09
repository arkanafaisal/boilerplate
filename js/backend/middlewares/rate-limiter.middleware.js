import { projectName } from "../configs/env.config.js"
import redis from "../libs/redis.lib.js"

const rlSchemas = {

    'GET:/health': { ttl: 1, limit: 60 },

    // --- AUTH ROUTER ---
    'POST:/api/auth/register': { ttl: 60, limit: 9, increaseBy: 2 },
    'POST:/api/auth/login': { ttl: 15, limit: 12, increaseBy: 3 }, // 10 attempts. Success fills 1/3 the bucket to prevent rapid re-logins.
    'POST:/api/auth/logout': { ttl: 15, limit: 30 }, // No success penalty. Low risk.
    'POST:/api/auth/refresh': { ttl: 15, limit: 60 }, // Generous for background token refreshing.
    'POST:/api/auth/verify-email/:token': { ttl: 60, limit: 10, increaseBy: 10 }, // 10 attempts for mistyped codes. 1 success per hour.
    'POST:/api/auth/forgot-password': { ttl: 60, limit: 5, increaseBy: 5 }, // Strict. 1 success per hour to prevent inbox bombing.
    'POST:/api/auth/reset-password/:token': { ttl: 60, limit: 10, increaseBy: 10 }, // 10 attempts for mistyped passwords. 1 success per hour.
    
    // --- USER ROUTER ---
    'GET:/api/users/me': { ttl: 1, limit: 60 }, // High limit for UI navigation.
    'PATCH:/api/users/me/username': { ttl: 60, limit: 10, increaseBy: 10 }, // Rare action. 1 success per hour to prevent name squatting/confusion.
    'PATCH:/api/users/me/email': { ttl: 60, limit: 10, increaseBy: 4 }, 
    'PATCH:/api/users/me/password': { ttl: 60, limit: 10, increaseBy: 4 }, // Security sensitive. 1 success per hour.
    'DELETE:/api/users/me': { ttl: 60, limit: 10, increaseBy: 10 },
}


export function getKey(req){
    if(!req.route){ throw new Error(`RL before route match: ${req.method} ${req.originalUrl}`) }

    return `${req.method}:${req.baseUrl}${req.route.path}`
}

export async function incrbyRateLimit(key, ip, incr = null){
    const config = rlSchemas[key]
    if (!config) throw new Error(`invalid rl mapping: ${key}`)

    const redisKey = `${projectName}:rl:${key}:${ip}`
        
    incr = incr || config.increaseBy
    const windowMs = config.ttl * 60000

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
            arguments: [incr.toString() ,windowMs.toString()]
        }
    )
    return count
}

export async function incrementRL(req) {
    const key = getKey(req)
    await incrbyRateLimit(key, req.ip)
}


export async function rl(req, res, next) {
    const key = getKey(req)
    const count = await incrbyRateLimit(key, req.ip, 1)

    if (count > rlSchemas[key].limit) {
        return res.sendStatus(429)
    }

    res.on('finish', ()=>{
        if(res.statusCode >= 200 && res.statusCode < 300 && rlSchemas[key].increaseBy){incrementRL(req)}
    })

    next()
}