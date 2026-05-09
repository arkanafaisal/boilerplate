import {createClient} from "redis"
import { logger } from "./logger.lib.js";
import { redisConfig } from "../configs/env.config.js";

const redis = createClient(redisConfig);

redis.on('error', err => logger.error(err, "redis connection error"));

(async () => {
  try { await redis.connect(); } catch (err) { console.error(err); process.exit(1); }
})();

export default redis
