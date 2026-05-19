import { Prisma } from '@prisma/client'
import { prisma } from '../libs/prisma.lib.js'
import { hashPassword } from '../utils/crypto.util.js'
import { logger } from '../libs/logger.lib.js'




// await prisma.$transaction(async (tx) => {
//     await tx.user.
// })

// await countLegacyPasswords()
async function countLegacyPasswords() {
    const count = await prisma.user.count({
        where: {
            NOT: {
                password: {
                    startsWith: 'v2$'
                }
            }
        }
    })

    console.log(`old password version left: ${count}`)
    return count
}


await removePasswordVersioning()
async function removePasswordVersioning() {
    const checking = await countLegacyPasswords()
    if(checking !== 0){
        console.log('not ready for step 2')
        return
    }

    let isContinue = true
    const batchNumber = 100

    try {
        while(isContinue){
            const batchUsers = await prisma.user.findMany({
                where: { password: { startsWith: 'v2$' } },
                take: batchNumber,
                select: { id: true, password: true }
            }) 

            if(batchUsers.length < batchNumber){isContinue = false}
            if(batchUsers.length === 0){isContinue = false; break}

            await prisma.$transaction(async (tx) => {
            

                for(const user of batchUsers){
                    const updatedUser = await tx.user.update({
                        where: { id: user.id },
                        data: { password: user.password.slice(3) },
                        select: { id: true }
                    })
                }

            })
        }

    } catch (error) {
        console.log(error)
    }
}


// export async function migratePasswordVersion({ id, stored, plain }: { id: number, stored: string, plain: string }){
//     if(stored.startsWith('v2$')){return}

//     const hashed = await hashPassword(plain)

//     try {
//         await prisma.user.update({
//             where: { id },
//             data: { password: hashed },
//             select: { id: true }
//         })
        
//     } catch (err) {
//         if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {return}

//         logger.warn({ id, err }, "migrate password version failed")
//         return
//     }
// }
