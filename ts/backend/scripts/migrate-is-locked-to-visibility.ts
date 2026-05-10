import mysql from "mysql2/promise";

import 'dotenv/config'
import { dbConfig } from "../configs/env.config.js";

const currentId = 0

process.exit(0)
const db = await mysql.createConnection(dbConfig);

await db.connect()
await db.beginTransaction()

try {
    // 
    await db.commit();
} catch (error) {
    await db.rollback()
    throw error
}