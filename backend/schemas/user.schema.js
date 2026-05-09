import Joi from "joi"

const username = Joi.string().trim().max(30).pattern(/^[a-zA-Z0-9]+$/)
const email = Joi.string().trim().lowercase().email().max(255)
const password = Joi.string().trim().min(6).max(255).required()
const publicKey = Joi.string().trim().max(255).required()

const token = Joi.string().trim().lowercase().length(64).hex().required()

export const auth = {
    register: { body: Joi.object({ username: username.required(), password }) },
    login: { 
        body: Joi.object({
            identifier: Joi.alternatives().try(
            email,
            username.lowercase()
            ).required(),
            password
        })
    },
    verifyEmail: { params: Joi.object({ token }) },
    forgotPassword: { body: Joi.object({ email: email.required() }) },
    resetPassword: {
        params: Joi.object({ token }),
        body: Joi.object({ password })
    },
    

}

export const user = {
    updateUsername: { body: Joi.object({ username: username.required() }) },
    updatePassword: { body: Joi.object({ oldPassword: password, newPassword: password }) },
    sendEmailVerification: { body: Joi.object({ email: email.required() }) },
    delete: { body: Joi.object({ username: username.required() }) }
    
}