import { Request, RequestHandler } from 'express'
import { ZodTypeAny } from 'zod'
import { authSchema, userSchema } from '../schemas/user.schema.js'
import { validateHelper } from '../utils/zod-formatter.util.js'

const schemas: Record<string, Record<string, ZodTypeAny>> = {
    register: authSchema.register,
    login: authSchema.login,
    verifyEmail: authSchema.verifyEmail,
    forgotPassword: authSchema.forgotPassword,
    resetPassword: authSchema.resetPassword,

    updateUsername: userSchema.updateUsername,
    updatePassword: userSchema.updatePassword,
    sendEmailVerification: userSchema.sendEmailVerification,
    deleteUser: userSchema.delete,
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

interface ValidatedRequest extends Request {
    validated: {
        body?: any;
        query?: any;
        params?: any;
    }
}

export function validate(schemaType: keyof typeof schemas): RequestHandler {
    return (req, res, next) => {
        if (!Object.hasOwn(schemas, schemaType)) { throw new Error('invalid schema type') }
        const schema = schemas[schemaType]

        const mutableReq = req as ValidatedRequest
        mutableReq.validated = {} 

        for (const field of fields) {
            if (!schema[field]) { continue }

            const { ok, message, value } = validateHelper(schema[field], req[field])
            if (!ok) {
                res.status(400).json({ error: message })
                return
            }
            mutableReq.validated[field] = value
        }

        next()
    }
}
