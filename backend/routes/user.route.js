import express from 'express';

import { rl } from '../middlewares/rate-limiter.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validator.middleware.js';



export const userRouter = express.Router();

userRouter.get('/me', rl, authenticate, userController.getMe)

userRouter.patch('/me/username',    rl,  authenticate, validate('updateUsername'),           userController.updateUsername)
userRouter.patch('/me/email',       rl,  authenticate, validate('sendEmailVerification'),    userController.sendEmailVerification)
userRouter.patch('/me/password',    rl,  authenticate, validate('updatePassword'),           userController.updatePassword)

userRouter.delete('/me',            rl,  authenticate, validate('deleteUser'),               userController.delete)