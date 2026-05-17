import { Request } from 'express';
import { ZodTypeAny, z } from 'zod';

// Ini adalah "Sihir Hitam" TypeScript. 
// Tipe ini akan beradaptasi (bervariasi) tergantung skema Zod apa yang Anda masukkan.
export type ValidatedRequest<T extends { body?: ZodTypeAny, query?: ZodTypeAny, params?: ZodTypeAny }> = Request & {
    validated: {
        body: T['body'] extends ZodTypeAny ? z.infer<T['body']> : undefined;
        query: T['query'] extends ZodTypeAny ? z.infer<T['query']> : undefined;
        params: T['params'] extends ZodTypeAny ? z.infer<T['params']> : undefined;
    }
}