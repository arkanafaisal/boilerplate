import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import 'dotenv/config'
import { logger } from './libs/logger.lib.js'
import { env, isDev, port, projectName } from './configs/env.config.js';


const app = express()
app.use(express.json())
app.set('trust proxy', true)
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

app.use(cors({
  origin: isDev? ['http://127.0.0.1:5173', 'http://localhost:5173'] : `https://${projectName}.arkanafaisal.my.id`,
  credentials: true,
  allowedHeaders: ['Content-Type', 'accessToken'],   // opsional, header yg diizinkan
  preflightContinue: false,
  optionsSuccessStatus: 204
}))


app.use((req, res, next) => {
  if(!(req.url.startsWith('/api'))){ return next() }
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start
    });
  });
  next();
});



import db from './libs/db.lib.js';
import redis from './libs/redis.lib.js';
import { rl } from './middlewares/rate-limiter.middleware.js';

app.get('/health', rl, async (req, res)=>{
  const now = Date.now()
  let payload = {
    status: 'ok',
    uptime: now - serverStartTime,
    timestamp: now,
    environment: env,
    services: {}
  }
  try {
    await withTimeout(db.query('SELECT 1'), 500)
    payload.services.db = 'ok'
  } catch (error) {
    payload.services.db = 'fail'
  }
  
  try {
    await withTimeout(redis.ping(), 500)
    payload.services.redis = 'ok'
  } catch (error) {
    payload.services.redis = 'fail'
  }

  payload.status = (payload.services.db === 'ok' && payload.services.redis === 'ok') ? 'ok' : 'degraded'

  return res.json(payload)
})

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    )
  ])
}





import { authRouter } from './routes/auth.route.js';
import { userRouter } from './routes/user.route.js';

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);




import { errorHandler } from './middlewares/error-handler.middleware.js';
app.use(errorHandler)



import path from 'path'
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "dist")));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});











const PORT = port
const serverStartTime = Date.now()
const server = app.listen(PORT, ()=>{ logger.info(`server running on ${PORT}`) })

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown() {
  logger.info('shutting down...');

  server.close();

  await db.end();
  await redis.quit();

  logger.info('server closed');
  process.exit(0);
}
