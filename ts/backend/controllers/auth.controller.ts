import { Request, Response, CookieOptions } from 'express';
import { randomUUID, createHash, randomBytes } from 'crypto'
import jwt from 'jsonwebtoken';

import { isDev, jwtSecret } from '../configs/env.config.js';

import { typedHandler } from '../utils/handler.util.js';

import { authModel } from '../models/user.model.js'
import * as redisHelper from '../helpers/redis.helper.js'

import { authSchema } from '../schemas/user.schema.js';

import { sendMail } from '../utils/mailer.util.js';
import { logger } from '../libs/logger.lib.js';

import { hashPassword } from '../utils/crypto.util.js';




const refreshTokenOption: CookieOptions = {
    httpOnly: true,
    sameSite: isDev ? 'none' : 'lax',
    secure: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
}


export const authController = {
    register: typedHandler<typeof authSchema.register>(async (req, res) => {
        const { username, password } = req.validated.body

        const hashed = await hashPassword(password)
        const insertId = await authModel.insert({ username, password: hashed })

        const ok = await issueRefreshToken({ id: insertId, res })
        if (!ok) { res.sendStatus(500); return }
        
        const accessToken = "Bearer " + jwt.sign({ sub: String(insertId) }, jwtSecret, { expiresIn: "10m" })

        logger.info({ userId: insertId, ip: req.ip }, 'user registered')
        res.status(201).json({ accessToken })
        return
    }),



    login: typedHandler<typeof authSchema.login>(async (req, res) => {
        const { identifier, password } = req.validated.body

        const id = await authModel.authenticate({ identifier, password })
        if (!id) { res.status(400).json({ error: "wrong username, email or password" }); return }

        const ok = await issueRefreshToken({ id, res })
        if (!ok) { res.sendStatus(500); return }
        
        const accessToken = "Bearer " + jwt.sign({ sub: String(id) }, jwtSecret, { expiresIn: '10m' })

        logger.info({ userId: id, ip: req.ip }, 'login success')
        res.status(200).json({ accessToken })
        return
    }),



    logout: typedHandler<{}>(async (req, res) => {
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            logger.debug({ ip: req.ip }, 'logout without refresh token success')
            res.sendStatus(200)
            return
        }

        await redisHelper.del('tokens', refreshToken).catch(() => { })
        res.clearCookie("refreshToken", refreshTokenOption)

        logger.debug({ ip: req.ip }, 'logout success')
        res.sendStatus(200)
        return
    }),



    refresh: typedHandler<{}>(async (req, res) => {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            logger.debug('refresh token missing')
            res.sendStatus(401)
            return
        }

        const tokenPayload = await redisHelper.get('tokens', refreshToken)
        if (!tokenPayload.ok) {
            logger.debug('refresh token invalid')
            res.sendStatus(401)
            return
        }
        const id = tokenPayload.data.id

        const isExist = await authModel.validateId({ id })
        if (!isExist) {
            await redisHelper.del('tokens', refreshToken).catch(() => { })
            res.clearCookie("refreshToken", refreshTokenOption)

            logger.warn('refresh token user not found')
            res.sendStatus(401)
            return
        }

        const accessToken = "Bearer " + jwt.sign({ sub: String(id) }, jwtSecret, { expiresIn: '10m' })

        logger.debug({ userId: id }, 'access token created')
        res.status(200).json({ accessToken })
        return
    }),



    verifyEmail: typedHandler<typeof authSchema.verifyEmail>(async (req, res) => {
        const { token } = req.validated.params

        const tokenHash = createHash('sha256').update(token).digest('hex')

        const tokenPayload = await redisHelper.get('verify_email', tokenHash)
        if (!tokenPayload.ok) {
            logger.debug('verify email token invalid')
            res.sendStatus(400)
            return
        }

        const success = await authModel.updateEmail(tokenPayload.data)
        await redisHelper.del('verify_email', tokenHash)
        if(!success){res.sendStatus(404); return}

        await redisHelper.invalidate('profile', String(tokenPayload.data.id))

        logger.info(tokenPayload.data, 'verify email success')
        res.sendStatus(200)
        return
    }),




    forgotPassword: typedHandler<typeof authSchema.forgotPassword>(async (req, res) => {
        const { email } = req.validated.body

        const id = await authModel.getIdByEmail({ email })
        if (!id) {
            logger.debug({ email }, 'forgot password email not found')
            res.sendStatus(200)
            return
        }

        const token = randomBytes(32).toString('hex')
        const tokenHash = createHash('sha256').update(token).digest('hex')

        const { ok: ok2 } = await redisHelper.set('reset_password', tokenHash, { id })
        if (!ok2) {
            logger.error('redis forgot password token SET failed')
            res.sendStatus(500)
            return
        }

        await sendMail.resetPassword({ email, token })

        logger.info({ email }, 'forgot password link sent')
        res.sendStatus(200)
        return
    }),



    resetPassword: typedHandler<typeof authSchema.resetPassword>(async (req, res) => {
        const { token } = req.validated.params
        const { password } = req.validated.body

        const tokenHash = createHash('sha256').update(token).digest('hex')

        const tokenPayload = await redisHelper.get('reset_password', tokenHash)
        if (!tokenPayload.ok) {
            logger.debug('reset password token invalid')
            res.status(400).json({ error: "token invalid" })
            return
        }
        const id = tokenPayload.data.id

        const success = await authModel.updatePassword({ password, id })
        await redisHelper.del('reset_password', tokenHash)
        if(!success){res.sendStatus(404); return}

        logger.info({ id }, 'reset password success')
        res.sendStatus(200)
        return
    })
}


async function issueRefreshToken({ id, res }: { id: number, res: Response }): Promise<boolean> {
    const refreshToken = randomUUID()

    const { ok: ok2 } = await redisHelper.set('tokens', refreshToken, { id })
    if (!ok2) {
        logger.error({ userId: id }, 'Redis refresh token SET failed')
        return false
    }

    res.cookie('refreshToken', refreshToken, refreshTokenOption)
    return true
}