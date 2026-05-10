import { z } from "zod";

const username = z.string().trim().max(30).regex(/^[a-zA-Z0-9]+$/);
const email = z.string().trim().toLowerCase().email().max(255);
const password = z.string().trim().min(6).max(255);

const token = z.string().trim().length(64).regex(/^[0-9a-fA-F]+$/);

export const auth = {
    register: { body: z.object({ username, password }) },
    login: {
        body: z.object({
            identifier: z.union([
                email,
                username
            ]),
            password
        })
    },
    verifyEmail: { params: z.object({ token }) },
    forgotPassword: { body: z.object({ email }) },
    resetPassword: {
        params: z.object({ token }),
        body: z.object({ password })
    },
}

export const user = {
    updateUsername: { body: z.object({ username }) },
    updatePassword: { body: z.object({ oldPassword: password, newPassword: password }).refine(data => data.oldPassword !== data.newPassword) },
    sendEmailVerification: { body: z.object({ email }) },
    delete: { body: z.object({ username }) }
}