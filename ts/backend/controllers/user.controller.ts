import { randomBytes, createHash } from 'crypto'
import bcrypt from 'bcrypt'

import { userModel } from "../models/user.model.js"
import { sendMail } from "../utils/mailer.util.js"

import * as redisHelper from '../helpers/redis.helper.js'
import { logger } from "../libs/logger.lib.js"
import { authTypedHandler } from "../utils/handler.util.js"

import { userSchema } from "../schemas/user.schema.js"
 
export const userController = {

    getMe: authTypedHandler<{}>(async (req, res) => {
        const cachePayload = await redisHelper.get('profile', String(req.user.id))
        if (cachePayload.ok) { res.json(cachePayload.data); return }

        const user = await userModel.getById({ id: req.user.id })
        if (!user) { res.sendStatus(401); return }

        await redisHelper.set('profile', String(req.user.id), user)
        res.json(user)
        return
    }),


    updateUsername: authTypedHandler<typeof userSchema.updateUsername>(async (req, res) => {
        const { username } = req.validated.body

        const success = await userModel.updateUsername({ id: req.user.id, username })
        if(!success){res.sendStatus(404); return}

        await redisHelper.invalidate('profile', String(req.user.id))


        logger.info({ userId: req.user.id, username }, 'update username success')
        res.sendStatus(200)
        return
    }),

    updatePassword: authTypedHandler<typeof userSchema.updatePassword>(async (req, res) => {
        const { oldPassword, newPassword } = req.validated.body

        const password = await userModel.getPasswordById({ id: req.user.id })
        if (!password) { res.sendStatus(401); return }

        const match = await bcrypt.compare(oldPassword, password)
        if (!match) { res.status(400).json({ error: "wrong password" }); return }

        const success = await userModel.updatePassword({ id: req.user.id, password: newPassword })
        if(!success){res.sendStatus(404); return}

        logger.info({ userId: req.user.id }, 'update password success')
        res.sendStatus(200)
        return
    }),


    sendEmailVerification: authTypedHandler<typeof userSchema.sendEmailVerification>(async (req, res) => {
        const { email } = req.validated.body

        const isExist = await userModel.validateEmail({ email })
        if (isExist) { res.sendStatus(409); return }

        const user = await userModel.getById({ id: req.user.id })
        if (!user) { res.sendStatus(401); return }
        if (user.email === email) { res.status(400).json({ error: 'No change in email' }); return }
        
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


    delete: authTypedHandler<typeof userSchema.delete>(async (req, res) => {
        const { username } = req.validated.body

        const success = await userModel.del({ id: req.user.id, username })
        if(!success){res.sendStatus(404); return}
        
        await redisHelper.invalidate('profile', String(req.user.id))


        logger.info({ userId: req.user.id, username }, 'delete user success')
        res.sendStatus(200)
        return
    })
}