import { z } from "zod";

const username = z.string().trim().max(30).regex(/^[a-zA-Z0-9]+$/);
const email = z.string().trim().toLowerCase().email().max(255);
const password = z.string().trim().min(6).max(255);

const token = z.string().trim().length(64).regex(/^[0-9a-fA-F]+$/);

export const authSchema = {
    register: { body: z.object({ username, password }).strict() },
    login: {
        body: z.object({
            identifier: z.union([
                email,
                username
            ]),
            password
        }).strict()
    },
    verifyEmail: { params: z.object({ token }).strict() },
    forgotPassword: { body: z.object({ email }).strict() },
    resetPassword: {
        params: z.object({ token }).strict(),
        body: z.object({ password }).strict()
    },
}

export const userSchema = {
    updateUsername: { body: z.object({ username }).strict() },
    updatePassword: { body: z.object({ oldPassword: password, newPassword: password }).strict().refine(data => data.oldPassword !== data.newPassword) },
    sendEmailVerification: { body: z.object({ email }).strict() },
    delete: { body: z.object({ username }).strict() },
}