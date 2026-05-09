import { randomUUID, createHash, randomBytes } from 'crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

import { auth as UserModel } from '../models/user.model.js'
import * as redisHelper from '../helpers/redis.helper.js'

import { sendMail } from '../utils/mailer.util.js';

import { logger } from '../libs/logger.lib.js';
import { isDev, jwtSecret } from '../configs/env.config.js';

export const authController = {}

const refreshTokenOption = {
    httpOnly: true,
    sameSite: isDev? 'none' : 'Lax',
    secure: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

authController.register = asyncHandler(async (req, res)=>{
    const { username, password } = req.validated.body

    const hashed = await bcrypt.hash(password, 10)
    const insertId = await UserModel.insert({ username, password: hashed })

    const ok = await issueRefreshToken({ id: insertId, res })
    if(!ok){return res.sendStatus(500)}
    const accessToken = jwt.sign({ id: insertId }, jwtSecret, {expiresIn: "10m"})


    logger.info({ userId: insertId, ip: req.ip }, 'user registered')
    return res.status(201).json({accessToken})
})


authController.login = asyncHandler(async (req, res)=>{
    const { identifier, password } = req.validated.body

    const id = await UserModel.authenticate({ identifier, password })
    if(!id){return res.status(400).json({error: "wrong username, email or password"})}
    
    const ok = await issueRefreshToken({ id, res })
    if(!ok){return res.sendStatus(500)}
    const accessToken = jwt.sign({ id }, jwtSecret, {expiresIn: '10m'})


    logger.info({ userId: id, ip: req.ip }, 'login success')
    return res.status(200).json({accessToken})
})


authController.logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    
    if (!refreshToken) {
        logger.debug({ ip: req.ip }, 'logout without refresh token success')
        return res.sendStatus(200)
    }

    await redisHelper.del('tokens', refreshToken).catch(()=>{})
    res.clearCookie("refreshToken", refreshTokenOption)
    
    logger.debug({ ip: req.ip }, 'logout success')
    return res.sendStatus(200)
})


authController.refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken){
        logger.debug('refresh token missing')
        return res.sendStatus(401)
    }

    const {ok, data: payload} = await redisHelper.get('tokens', refreshToken)
    if(!ok){
        logger.warn('refresh token invalid')
        return res.sendStatus(401)
    }
    
    const isExist = await UserModel.validateId({id: payload.id})
    if(!isExist){
        await redisHelper.del('tokens', refreshToken).catch(()=>{})
        res.clearCookie("refreshToken", refreshTokenOption)

        logger.warn('refresh token user not found')
        return res.sendStatus(401)
    }

    const accessToken = jwt.sign({id: payload.id}, jwtSecret, {expiresIn: '10m'})


    logger.debug({ userId: payload.id }, 'access token created')
    return res.status(200).json({accessToken})
})





authController.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.validated.params

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const {ok:ok2, data: payload} = await redisHelper.get('verify_email', tokenHash)
    if(!ok2){
        logger.debug('verify email token invalid')
        return res.sendStatus(400)
    }

    const {affectedRows, changedRows} = await UserModel.updateEmail(payload)
    await redisHelper.del('verify_email', tokenHash)
    if(affectedRows === 0){
        await redisHelper.invalidate('profile', payload.id)

        logger.warn('verify email token user not found')
        return res.sendStatus(400)
    }
    if(changedRows === 0){
        logger.info(payload, 'verify email success but email not changed')
        return res.sendStatus(200)
    }

    await redisHelper.invalidate('profile', payload.id)

    
    logger.info(payload, 'verify email success')
    return res.sendStatus(200)

})


authController.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.validated.body

    const id = await UserModel.getIdByEmail({ email })
    if(!id){
        logger.debug({ email }, 'forgot password email not found')
        return res.sendStatus(200)
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const {ok: ok2} = await redisHelper.set('reset_password', tokenHash, { id })
    if(!ok2){
        logger.error('redis forgot password token SET failed')
        return res.sendStatus(500)
    }
    
    await sendMail.resetPassword({email, token})
    
    
    logger.info({ email }, 'forgot password link sent')
    return res.sendStatus(200)

})



authController.resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.validated.params
    const { password } = req.validated.body

    const tokenHash = createHash('sha256').update(token).digest('hex')

    const {ok:ok2, data: payload} = await redisHelper.get('reset_password', tokenHash)
    if(!ok2){
        logger.debug('reset password token invalid')
        return res.status(400).json({error: "token invalid"})
    }

    const hashed = await bcrypt.hash(password, 10)
    const affectedRows = await UserModel.updatePassword({password: hashed, id: payload.id})
    await redisHelper.del('reset_password', tokenHash)
    if(affectedRows === 0){
        logger.warn('reset password user not found')
        return res.sendStatus(400)
    }
    

    logger.info({ id: payload.id }, 'reset password success')
    return res.sendStatus(200)
})


async function issueRefreshToken({ id, res }) {
    const refreshToken = randomUUID()

    const {ok:ok2} = await redisHelper.set('tokens', refreshToken, { id })
    if(!ok2){
        logger.error({ userId: id }, 'Redis refresh token SET failed')
        return false
    }

    res.cookie('refreshToken', refreshToken, refreshTokenOption)
    return true
}