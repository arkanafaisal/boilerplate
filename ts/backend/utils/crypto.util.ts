import { createHash } from 'crypto';
import bcrypt from 'bcrypt';

export async function hashPassword(plain: string) {
    const preHash = createHash('sha256').update(plain).digest('hex');
    const finalHash = await bcrypt.hash(preHash, 10);
    
    return finalHash;
}


export async function comparePassword(plain: string, hashed: string) {
    const preHash = createHash('sha256').update(plain).digest('hex');
    
    const isMatch = await bcrypt.compare(preHash, hashed);
    
    return isMatch;
}