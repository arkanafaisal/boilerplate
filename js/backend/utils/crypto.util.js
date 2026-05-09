import crypto from "crypto";
import { logger } from "../libs/logger.lib.js";
import { encryptionKey } from "../configs/env.config.js";

const algorithm = "aes-256-gcm";

const key = Buffer.from(encryptionKey, "hex")

if (key.length !== 32) {
  throw new Error('Invalid ENCRYPTION_KEY length (must be 32 bytes)')
}

export function encrypt(text) {
  try {
    if (typeof text !== 'string') {
      throw new Error('Invalid encrypt input')
    }

    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv(algorithm, key, iv)

    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final()
    ])

    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      content: encrypted.toString("hex"),
      tag: tag.toString("hex")
    };

  } catch (err) {
    logger.error(err, 'encrypt failed')
    throw err
  }
}

export function decrypt(enc) {
   try {
    if (!enc?.iv || !enc?.content || !enc?.tag) {
      throw new Error('Invalid encrypted payload')
    }
    const iv = Buffer.from(enc.iv, "hex")
    const content = Buffer.from(enc.content, "hex")
    const tag = Buffer.from(enc.tag, "hex")

    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      decipher.update(content),
      decipher.final()
    ])

    return decrypted.toString("utf8")

  } catch (err) {
    logger.error(err, 'decrypt failed')
    throw err
  }
}

export function decryptHelper(data){
    try {
    if (!data) throw new Error('Invalid decrypt data')

    const { iv, content, tag, ...others } = data
    const plain = decrypt({ iv, content, tag })

    return { ...others, content: plain }

  } catch (err) {
    logger.error(err, 'decryptHelper failed')
    throw err
  }
}