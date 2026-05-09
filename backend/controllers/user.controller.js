import asyncHandler from "express-async-handler"
import { randomBytes, createHash } from 'crypto'
import bcrypt from 'bcrypt'

import { user as UserModel } from "../models/user.model.js"
import { sendMail } from "../utils/mailer.util.js"

import * as redisHelper from '../helpers/redis.helper.js'
import { logger } from "../libs/logger.lib.js"


export const userController = {}

userController.getMe = asyncHandler(async (req, res) => {
    const {ok, data} = await redisHelper.get('profile', req.user.id)
    if(ok){return res.json(data)}

    const user = await UserModel.getById({id: req.user.id})
    if(!user){return res.sendStatus(401)}

    await redisHelper.set('profile', req.user.id, user)
    return res.json(user)
})


userController.updateUsername = asyncHandler(async (req, res) => {
    const { username } = req.validated.body

    const {affectedRows, changedRows} = await UserModel.updateUsername({ username, id: req.user.id })
    if(affectedRows === 0){return res.sendStatus(401)}
    if(changedRows === 0){
        logger.info({ userId: req.user.id, username }, 'update username success')
        return res.sendStatus(200)
    }

    await redisHelper.invalidate('profile', req.user.id)


    logger.info({ userId: req.user.id, username }, 'update username success')
    return res.sendStatus(200)
})

userController.updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.validated.body

    const user = await UserModel.getPasswordById({ id: req.user.id })
    if(!user){return res.sendStatus(401)}

    const match = await bcrypt.compare(oldPassword, user.password)
    if(!match){return res.status(400).json({error: "wrong password"})}

    const hashed = await bcrypt.hash(newPassword, 10)
    const affectedRows = await UserModel.updatePassword({ password: hashed, id: req.user.id })
    if(affectedRows === 0){return res.sendStatus(401)}


    logger.info({ userId: req.user.id }, 'update password success')
    return res.sendStatus(200)
})


userController.sendEmailVerification = asyncHandler(async (req, res) => {
    const { email } = req.validated.body

    const isExist = await UserModel.validateEmail({ email })
    if(isExist){return res.sendStatus(409)}
    
    const user = await UserModel.getById({ id: req.user.id })
    if(!user){return res.sendStatus(401)}
    if(user.email === email){return res.status(400).json({error: 'No change in email'})}

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    const {ok: ok2} = await redisHelper.set('verify_email', tokenHash, {id: req.user.id, email})
    if(!ok2){
        logger.error({ userId: req.user.id }, 'redis email verification token SET failed')    
        return res.sendStatus(500)
    }

    await sendMail.verifyEmail({email, token})

    
    logger.info({ userId: req.user.id }, 'request email verification success')
    return res.sendStatus(200)
})


userController.delete = asyncHandler(async (req, res) => {
    const { username } = req.validated.body

    const affectedRows = await UserModel.del({ id: req.user.id, username })
    if(!affectedRows){return res.sendStatus(400)}

    await redisHelper.invalidate('profile', req.user.id)
    
    
    logger.info({ userId: req.user.id, username }, 'delete user success')
    return res.sendStatus(200)
})