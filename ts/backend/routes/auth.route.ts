import express from 'express';

import { rl } from '../middlewares/rate-limiter.middleware.js';
import { validate } from '../middlewares/validator.middleware.js';
import { authController } from '../controllers/auth.controller.js';



export const authRouter = express.Router();

authRouter.post('/register',                rl('register'),   validate('register'),        authController.register);
authRouter.post('/login',                   rl('login'),   validate('login'),           authController.login);
authRouter.post('/logout',                  rl('logout'),                                authController.logout)
authRouter.post('/refresh',                 rl('refresh'),                                authController.refresh);


authRouter.post('/verify-email/:token',     rl('verifyEmail'),   validate('verifyEmail'),     authController.verifyEmail)
authRouter.post("/forgot-password",         rl('sendResetPasswordLink'),   validate('forgotPassword'),  authController.forgotPassword)
authRouter.post("/reset-password/:token",   rl('verifyResetPassword'),   validate('resetPassword'),   authController.resetPassword)