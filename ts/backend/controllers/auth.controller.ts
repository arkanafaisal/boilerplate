import { randomUUID, createHash, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { Response, CookieOptions } from 'express';

import { auth as UserModel } from '../models/user.model.js'
import * as redisHelper from '../helpers/redis.helper.js'

import { sendMail } from '../utils/mailer.util.js';

import { logger } from '../libs/logger.lib.js';
import { isDev, jwtSecret } from '../configs/env.config.js';


const refreshTokenOption: CookieOptions = {
    httpOnly: true,
    sameSite: isDev ? 'none' : 'lax',
    secure: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
}


export const authController = {
    register: asyncHandler(async (req, res) => {
        const { username, password } = req.validated.body

        const hashed = await bcrypt.hash(password, 10)
        const insertId = await UserModel.insert({ username, password: hashed })

        const ok = await issueRefreshToken({ id: insertId, res })
        if (!ok) {
            res.sendStatus(500)
            return
        }
        const accessToken = jwt.sign({ id: insertId }, jwtSecret, { expiresIn: "10m" })

        logger.info({ userId: insertId, ip: req.ip }, 'user registered')
        res.status(201).json({ accessToken })
        return
    }),



    login: asyncHandler(async (req, res) => {
        const { identifier, password } = req.validated.body

        const id = await UserModel.authenticate({ identifier, password })
        if (!id) {
            res.status(400).json({ error: "wrong username, email or password" })
            return
        }

        const ok = await issueRefreshToken({ id, res })
        if (!ok) {
            res.sendStatus(500)
            return
        }
        const accessToken = jwt.sign({ id }, jwtSecret, { expiresIn: '10m' })

        logger.info({ userId: id, ip: req.ip }, 'login success')
        res.status(200).json({ accessToken })
        return
    }),



    logout: asyncHandler(async (req, res) => {
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



    refresh: asyncHandler(async (req, res) => {
        const refreshToken = req.cookies.refreshToken
        if (!refreshToken) {
            logger.debug('refresh token missing')
            res.sendStatus(401)
            return
        }

        const { ok, data: payload } = await redisHelper.get('tokens', refreshToken)
        if (!ok || !payload) {
            logger.warn('refresh token invalid')
            res.sendStatus(401)
            return
        }

        const isExist = await UserModel.validateId({ id: payload.id })
        if (!isExist) {
            await redisHelper.del('tokens', refreshToken).catch(() => { })
            res.clearCookie("refreshToken", refreshTokenOption)

            logger.warn('refresh token user not found')
            res.sendStatus(401)
            return
        }

        const accessToken = jwt.sign({ id: payload.id }, jwtSecret, { expiresIn: '10m' })

        logger.debug({ userId: payload.id }, 'access token created')
        res.status(200).json({ accessToken })
        return
    }),



    verifyEmail: asyncHandler(async (req, res) => {
        const { token } = req.validated.params

        const tokenHash = createHash('sha256').update(token).digest('hex')

        const { ok: ok2, data: payload } = await redisHelper.get('verify_email', tokenHash)
        if (!ok2 || !payload) {
            logger.debug('verify email token invalid')
            res.sendStatus(400)
            return
        }

        const { affectedRows, changedRows } = await UserModel.updateEmail(payload)
        await redisHelper.del('verify_email', tokenHash)
        if (affectedRows === 0) {
            await redisHelper.invalidate('profile', payload.id)

            logger.warn('verify email token user not found')
            res.sendStatus(400)
            return
        }
        if (changedRows === 0) {
            logger.info(payload, 'verify email success but email not changed')
            res.sendStatus(200)
            return
        }

        await redisHelper.invalidate('profile', payload.id)

        logger.info(payload, 'verify email success')
        res.sendStatus(200)
        return
    }),




    forgotPassword: asyncHandler(async (req, res) => {
        const { email } = req.validated.body

        const id = await UserModel.getIdByEmail({ email })
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



    resetPassword: asyncHandler(async (req, res) => {
        const { token } = req.validated.params
        const { password } = req.validated.body

        const tokenHash = createHash('sha256').update(token).digest('hex')

        const { ok: ok2, data: payload } = await redisHelper.get('reset_password', tokenHash)
        if (!ok2 || !payload) {
            logger.debug('reset password token invalid')
            res.status(400).json({ error: "token invalid" })
            return
        }

        const hashed = await bcrypt.hash(password, 10)
        const affectedRows = await UserModel.updatePassword({ password: hashed, id: payload.id })
        await redisHelper.del('reset_password', tokenHash)
        if (affectedRows === 0) {
            logger.warn('reset password user not found')
            res.sendStatus(400)
            return
        }

        logger.info({ id: payload.id }, 'reset password success')
        res.sendStatus(200)
        return
    })
}

interface IssueRefreshTokenParams {
    id: number;
    res: Response;
}

async function issueRefreshToken({ id, res }: IssueRefreshTokenParams): Promise<boolean> {
    const refreshToken = randomUUID()

    const { ok: ok2 } = await redisHelper.set('tokens', refreshToken, { id })
    if (!ok2) {
        logger.error({ userId: id }, 'Redis refresh token SET failed')
        return false
    }

    res.cookie('refreshToken', refreshToken, refreshTokenOption)
    return true
}