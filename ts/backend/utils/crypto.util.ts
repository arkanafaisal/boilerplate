import { createHash } from 'crypto';
import bcrypt from 'bcrypt';

export async function hashPassword(plain: string) {
    const preHash = createHash('sha256').update(plain).digest('hex');
    const finalHash = await bcrypt.hash(preHash, 10);
    
    // return 'v2$' + finalHash;
    return finalHash
}


export async function comparePassword(plain: string, stored: string) {
    // if(stored.startsWith('v2$')){
    //     stored = stored.slice(3);
    //     const preHash = createHash('sha256').update(plain).digest('hex');
    //     return await bcrypt.compare(preHash, stored);
    // }
    
    // return bcrypt.compare(plain, stored)
    
    const preHash = createHash('sha256').update(plain).digest('hex');
    return await bcrypt.compare(preHash, stored)
}