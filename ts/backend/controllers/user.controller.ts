import asyncHandler from "express-async-handler"
import { randomBytes, createHash } from 'crypto'
import bcrypt from 'bcrypt'

import { user as UserModel } from "../models/user.model.js"
import { sendMail } from "../utils/mailer.util.js"

import * as redisHelper from '../helpers/redis.helper.js'
import { logger } from "../libs/logger.lib.js"


export const userController = {

    getMe: asyncHandler(async (req, res) => {
        const { ok, data } = await redisHelper.get('profile', req.user.id)
        if (ok) {
            res.json(data)
            return
        }
        const user = await UserModel.getById({ id: req.user.id })
        if (!user) {
            res.sendStatus(401)
            return
        }
        await redisHelper.set('profile', req.user.id, user)
        res.json(user)
        return
    }),


    updateUsername: asyncHandler(async (req, res) => {
        const { username } = req.validated.body

        const { affectedRows, changedRows } = await UserModel.updateUsername({ username, id: req.user.id })
        if (affectedRows === 0) {
            res.sendStatus(401)
            return
        }
        if (changedRows === 0) {
            logger.info({ userId: req.user.id, username }, 'update username success')
            res.sendStatus(200)
            return
        }

        await redisHelper.invalidate('profile', req.user.id)


        logger.info({ userId: req.user.id, username }, 'update username success')
        res.sendStatus(200)
        return
    }),

    updatePassword: asyncHandler(async (req, res) => {
        const { oldPassword, newPassword } = req.validated.body

        const user = await UserModel.getPasswordById({ id: req.user.id })
        if (!user) {
            res.sendStatus(401)
            return
        }
        const match = await bcrypt.compare(oldPassword, user.password)
        if (!match) {
            res.status(400).json({ error: "wrong password" })
            return
        }
        const hashed = await bcrypt.hash(newPassword, 10)
        const affectedRows = await UserModel.updatePassword({ password: hashed, id: req.user.id })
        if (affectedRows === 0) {
            res.sendStatus(401)
            return
        }
        logger.info({ userId: req.user.id }, 'update password success')
        res.sendStatus(200)
        return
    }),


    sendEmailVerification: asyncHandler(async (req, res) => {
        const { email } = req.validated.body

        const isExist = await UserModel.validateEmail({ email })
        if (isExist) {
            res.sendStatus(409)
            return
        }
        const user = await UserModel.getById({ id: req.user.id })
        if (!user) {
            res.sendStatus(401)
            return
        }
        if (user.email === email) {
            res.status(400).json({ error: 'No change in email' })
            return
        }
        const token = randomBytes(32).toString('hex')
        const tokenHash = createHash('sha256').update(token).digest('hex')

        const { ok: ok2 } = await redisHelper.set('verify_email', tokenHash, { id: req.user.id, email })
        if (!ok2) {
            logger.error({ userId: req.user.id }, 'redis email verification token SET failed')
            res.sendStatus(500)
            return
        }

        await sendMail.verifyEmail({ email, token })


        logger.info({ userId: req.user.id }, 'request email verification success')
        res.sendStatus(200)
        return
    }),


    delete: asyncHandler(async (req, res) => {
        const { username } = req.validated.body

        const affectedRows = await UserModel.del({ id: req.user.id, username })
        if (!affectedRows) {
            res.sendStatus(400)
            return
        }
        await redisHelper.invalidate('profile', req.user.id)


        logger.info({ userId: req.user.id, username }, 'delete user success')
        res.sendStatus(200)
        return
    })
}