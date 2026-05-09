import express from 'express';

import { rl } from '../middlewares/rate-limiter.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { authController } from '../controllers/auth.controller.js';



export const authRouter = express.Router();

authRouter.post('/register',                rl,   validate('register'),        authController.register);
authRouter.post('/login',                   rl,   validate('login'),           authController.login);
authRouter.post('/logout',                  rl,                                authController.logout)
authRouter.post('/refresh',                 rl,                                authController.refresh);


authRouter.post('/verify-email/:token',     rl,   validate('verifyEmail'),     authController.verifyEmail)
authRouter.post("/forgot-password",         rl,   validate('forgotPassword'),  authController.forgotPassword)
authRouter.post("/reset-password/:token",   rl,   validate('resetPassword'),   authController.resetPassword)