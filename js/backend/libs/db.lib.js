import mysql from 'mysql2/promise'
import { dbConfig } from '../configs/env.config.js';

const db = mysql.createPool({
  ...dbConfig,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,

  connectTimeout: 10000
})

export default db;
