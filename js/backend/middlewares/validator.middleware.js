import { auth, user } from '../schemas/user.schema.js'
import { validate as validateHelper } from '../utils/joi-formatter.util.js'

const schemas = {
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

const fields = ['body', 'query', 'params']

function validateSchemas() {
    for (const schemaName of Object.keys(schemas)) {
        const schema = schemas[schemaName]

        for (const field of Object.keys(schema)) {
            if (!fields.includes(field)) {throw new Error(`invalid schema config: ${schemaName}.${field}`)}
        }
    }
}

validateSchemas()




export function validate(schemaType) {
    return (req, res, next)=>{
        if(!Object.hasOwn(schemas, schemaType)){throw new Error('invalid schema type')}
        const schema = schemas[schemaType]

        req.validated = {}
        for(const field of fields){
            if(!schema[field]){continue}

            const { ok, message, value } = validateHelper(schema[field], req[field])
            if(!ok){return res.status(400).json({ error: message })}

            req.validated[field] = value
        }

        next()
    }
}



