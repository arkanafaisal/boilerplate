import { prisma } from '../libs/prisma.lib.js'
import { comparePassword, hashPassword } from '../utils/crypto.util.js'

// import { migratePasswordVersion } from '../scripts/migrate-password-version.js'

export const authModel = {
    insert: async ({ username, password }: { username: string, password: string }) => {
        const user = await prisma.user.create({
            data: {
                username,
                password
            }
        })

        return user.id
    },
    authenticate: async ({ identifier, password }: { identifier: string, password: string }) => {
        const user = await prisma.user.findFirst({
            where: { OR: [{ username: identifier }, { email: identifier }]},
            select: { id: true, password: true }
        })
        if(!user){return null}

        const isMatch = await comparePassword(password, user.password)
        // if(isMatch){void migratePasswordVersion({ id: user.id, stored: user.password, plain: password })}
        return isMatch? user.id : null
    },
    validateId: async ({ id }: { id: number }) => {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true }
        })
        return user !== null
    },
    updateEmail: async ({ email, id }: { email: string, id: number }) => {
        const user = await safePrisma(
            prisma.user.update({
                where: { id },
                data: { email },
                select: { email: true }
        }))

        return !!user
    },
    getIdByEmail: async ({ email }: { email: string }) => {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        })

        return user? user.id : null
    },
    updatePassword: async ({ id, password }: { id: number, password: string }) => {
        const hashed = await hashPassword(password)

        const user = await safePrisma(
            prisma.user.update({
                where: { id },
                data: { password: hashed },
                select: { id: true }
        }))

        return !!user
    }
}

export const userModel = {
    getById: async ({ id }: { id: number }) => {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { username: true, email: true }
        })
        
        return user
    },
    validateEmail: async ({ email }: { email: string }) => {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true }
        })
        
        return user !== null
    },
    updateUsername: async ({ id, username }: { id: number, username: string }) => {
        const user = await safePrisma(
            prisma.user.update({
                where: { id },
                data: { username },
                select: { id: true }
        }))

        return !!user
    },
    getPasswordById: async ({ id }: { id: number }) => { 
        const user = await prisma.user.findUnique({
            where: { id },
            select: { password: true }
        })
        
        return user? user.password : null
    },
    updatePassword: async ({ id, password }: { id: number, password: string }) => {
        const hashed = await hashPassword(password)

        const user = await safePrisma(
            prisma.user.update({
                where: { id },
                data: { password: hashed },
                select: { id: true }
        }))

        return !!user
    },
    del: async ({ id, username }: { id: number, username: string }) => {
        const user = await safePrisma(
            prisma.user.delete({
                where: { id, username },
                select: { id: true }
        }))

        return !!user
    },
    
}



import { Prisma } from '@prisma/client'

const safePrisma = async <T>(prismaPromise: Promise<T>): Promise<T | null> => {
    try {
        return await prismaPromise;
    } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            return null;
        }
        throw err;
    }
};