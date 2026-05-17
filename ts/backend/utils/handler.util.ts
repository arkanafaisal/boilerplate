import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodTypeAny, z } from 'zod';

export type ValidatedRequest<T extends { body?: ZodTypeAny, query?: ZodTypeAny, params?: ZodTypeAny }> = Request & {
    validated: {
        body: T['body'] extends ZodTypeAny ? z.infer<T['body']> : undefined;
        query: T['query'] extends ZodTypeAny ? z.infer<T['query']> : undefined;
        params: T['params'] extends ZodTypeAny ? z.infer<T['params']> : undefined;
    }
}

export const typedHandler = <T extends { body?: ZodTypeAny, query?: ZodTypeAny, params?: ZodTypeAny }>(
    handler: (req: ValidatedRequest<T>, res: Response, next: NextFunction) => Promise<any> | void
) => handler as unknown as RequestHandler;



export type AuthValidatedRequest<T extends { body?: ZodTypeAny, query?: ZodTypeAny, params?: ZodTypeAny }> = ValidatedRequest<T> & {
    user: { id: number } 
}

export const authTypedHandler = <T extends { body?: ZodTypeAny, query?: ZodTypeAny, params?: ZodTypeAny }>(
    handler: (req: AuthValidatedRequest<T>, res: Response, next: NextFunction) => Promise<any> | void
) => handler as unknown as RequestHandler;