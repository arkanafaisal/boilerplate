import db from "../libs/db.lib.js"
import bcrypt from 'bcrypt'

export const auth = {
    insert: async ({ username, password }) => {
        const [{insertId}] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password])
        if(!insertId){throw new Error('ER_NO_INSERT_ID')}
        
        return insertId
    },
    authenticate: async ({ identifier, password }) => {
        const [[user]] = await db.query('SELECT id, username, password FROM users WHERE (username = ? OR email = ?)', [identifier, identifier])
        if(!user){return null}

        const ok = await bcrypt.compare(password, user.password)
        if(!ok){return null}
        return user.id
    },
    validateId: async ({ id }) => {
        const [[row]] = await db.query('SELECT 1 FROM users WHERE id = ?', [id])
        return !!row
    },
    updateEmail: async ({ email, id }) => {
        const [{affectedRows, changedRows}] = await db.query("UPDATE users SET email = ? WHERE id = ?", [email, id])
        return {affectedRows, changedRows}
    },
    getIdByEmail: async ({ email }) => {
        const [[user]] = await db.query("SELECT id FROM users WHERE email = ?", [email])
        return user?.id
    },
    updatePassword: async ({ id, password }) => {
        const [{affectedRows}] = await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id])
        return affectedRows
    }
}

export const user = {
    getById: async ({ id }) => {
        const [[user]] = await db.query('SELECT username, email FROM users WHERE id = ?', [id])
        return user
    },
    validateEmail: async ({ email }) => {
        const [[row]] = await db.query("SELECT 1 FROM users WHERE email = ?", [email])
        return !!row
    },
    updateUsername: async ({ id, username }) => {
        const [{affectedRows, changedRows}] = await db.query('UPDATE users SET username = ? WHERE id = ?', [username, id])
        return {affectedRows, changedRows}
    },
    getPasswordById: async ({ id }) => {
        const [[user]] = await db.query('SELECT password FROM users WHERE id = ?', [id])
        return user 
    },
    updatePassword: async ({ id, password }) => {
        const [{affectedRows}] = await db.query("UPDATE users SET password = ? WHERE id = ?", [password, id])
        return affectedRows
    },
    del: async ({ id, username }) => {
        const [{ affectedRows }] = await db.query('DELETE FROM users WHERE id = ? AND username = ?', [id, username])
        return affectedRows
    },
    
}

