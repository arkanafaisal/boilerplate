import "dotenv/config";

export const env = requireEnv('NODE_ENV')
export const isDev = env === "development"
export const isProd = env === "production"

export const projectName = requireEnv('PROJECT_NAME')

export const port = requireEnv('PORT')
export const logLevel = requireEnv('LOG_LEVEL')



export const redisConfig = {
    url: requireEnv('REDIS_URL')
}

export const dbConfig = {
    host: requireEnv('MYSQL_HOST'),
    user: requireEnv('MYSQL_USER'),
    password: requireEnv('MYSQL_PASSWORD'),
    database: requireEnv('MYSQL_DB')
}

export const smtpConfig = {
    user: requireEnv('SMTP_USER'),
    pass: requireEnv('SMTP_PASS')
}


export const jwtSecret = requireEnv('JWT_SECRET')
export const encryptionKey = requireEnv('ENCRYPTION_KEY')


function requireEnv(key) {
    const value = process.env[key]
    if (!value) throw new Error(`Missing env: ${key}`)
    return value
}