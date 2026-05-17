import { projectName } from "../configs/env.config.js"
import { logger } from "../libs/logger.lib.js"
import redis from "../libs/redis.lib.js"

const base = projectName
const redisType = {
    "tokens": {level: 1, prefix: ':tokens:', ttl: 60 * 60 * 168},
    "verify_email": {level: 2, prefix: ':verify_email:', ttl: 60 * 15},
    "reset_password": {level: 2, prefix: ':reset_password:', ttl: 60 * 15},

    'profile': {level: 3, prefix: ':cache:profile:', ttl: 60 * 30},
} as const
type RedisType = keyof typeof redisType

type RedisPayloadType = {
    'tokens': {id: number},
    'verify_email': {id: number, email: string},
    'reset_password': {id: number},

    'profile': any
} 


function getKey(type: RedisType, key: string){
    const prefix = base + redisType[type].prefix

    if(!prefix){throw new Error('redis type invalid')}

    return prefix + key
}

export async function get<K extends RedisType>(type: K, key: string): Promise< {ok: false} | {ok: true, data: RedisPayloadType[K]}>{
    const level = redisType[type].level
    try {
        const rawData = await redis.get(getKey(type, key))
        if(!rawData){return {ok: false}}
        
        if(level >= 3){logger.trace({ key: getKey(type, key) }, 'redis cache used')}
        const data = Buffer.isBuffer(rawData) ? rawData.toString('utf-8') : rawData
        return {ok: true, data: JSON.parse(data)}

    } catch(err) {
        if(level >= 3){
            logger.debug({ err }, "redis GET cache failed")
            return {ok: false} 
        }

        const message = `redis GET ${level === 1? 'session' : 'token'} error`
        logger.error({ err }, message)
        throw err
    }
}

export async function set<K extends RedisType>(type: K, key: string, data: RedisPayloadType[K]){
    try {
        await redis.set(getKey(type, key), JSON.stringify(data), {"EX": redisType[type].ttl})
        return {ok: true} 
    } catch (err) {
        if(redisType[type].level >= 3){
            logger.debug({ err }, "redis SET cache error")
            return {ok: false}
        }

        let retrySuccess = true
        await retry(()=>redis.set(getKey(type, key), JSON.stringify(data), {"EX": redisType[type].ttl}), 3, 100).catch(()=>{retrySuccess = false})
        return {ok: retrySuccess}
    }
}

export async function del(type: RedisType, key: string){
    try {
        await redis.del(getKey(type, key))
    } catch (err) {
        const level = redisType[type].level
        if(level >= 3){
            logger.warn({ err }, 'redis DEL cache failed')
            redis.del(getKey(type, key)).catch(()=>{})
        } else {
            const message = `redis DEL ${level === 1? 'session' : 'token'} error`
            logger.error({ err }, message)
            await retry(()=>redis.del(getKey(type, key)), 3, 200)
        }
    }
}

export async function delPattern(type: RedisType, key: string) {
    const pattern = getKey(type, key) + '*'
    let cursor = '0'
    try {
        do {
            const { keys, cursor: nextCursor } = await redis.scan(cursor, { MATCH: pattern, COUNT: 50 })

            cursor = Buffer.isBuffer(nextCursor) ? nextCursor.toString('utf-8') : nextCursor
            
            if (keys.length) {
                await redis.del(keys)
            }
        } while (cursor !== '0')
    } catch (err) {
        logger.debug({ err }, 'redis DEL cache failed')
    }
}



export async function invalidate(type: RedisType, key: string) {
    const level = redisType[type].level
    // if(level === 4){
    //     await delPattern(type, key)
    //     retry(()=>delPattern(type, key), 1, 500).catch(()=>{})
        
    // } else 
    if(level === 3){
        await del(type, key)
        retry(()=>del(type, key), 1, 500).catch(()=>{})

    } else {
        throw new Error(`wrong call: invalidate is not for type ${type}`)
    }
}


















function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function retry(fn: Function, count: number, delay = 100) {
    let attempt = 1
        
    while (attempt <= count) {
        try {
        return await fn()
        } catch (err) {
        if (attempt === count){
            logger.error({ err }, `redis action retry failed (${count} times)`)
            throw err
        }
        attempt++
        await sleep(delay)
        }
    }
}
