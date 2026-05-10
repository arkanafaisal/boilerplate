import { RequestHandler } from 'express'
import { ZodTypeAny } from 'zod'
import { auth, user } from '../schemas/user.schema.js'
import { validateHelper } from '../utils/zod-formatter.util.js'

const schemas: Record<string, Record<string, ZodTypeAny>> = {
    register: auth.register,
    login: auth.login,
    verifyEmail: auth.verifyEmail,
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,

    updateUsername: user.updateUsername,
    updatePassword: user.updatePassword,
    sendEmailVerification: user.sendEmailVerification,
    deleteUser: user.delete,
}

const fields = ['body', 'query', 'params'] as const

function validateSchemas() {
    for (const schemaName of Object.keys(schemas)) {
        const schema = schemas[schemaName]

        type Field = typeof fields[number]
        for (const field of Object.keys(schema)) {
            if (!fields.includes(field as Field)) { throw new Error(`invalid schema config: ${schemaName}.${field}`) }
        }
    }
}

validateSchemas()

export function validate(schemaType: keyof typeof schemas): RequestHandler {
    return (req, res, next) => {
        if (!Object.hasOwn(schemas, schemaType)) { throw new Error('invalid schema type') }
        const schema = schemas[schemaType]

        req.validated = {}
        for (const field of fields) {
            if (!schema[field]) { continue }

            const { ok, message, value } = validateHelper(schema[field], req[field])
            if (!ok) {
                res.status(400).json({ error: message })
                return
            }
            req.validated[field] = value
        }

        next()
    }
}
