const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'controllers', 'auth.controller.ts'),
    path.join(__dirname, 'controllers', 'user.controller.ts'),
    path.join(__dirname, 'middlewares', 'auth.middleware.ts'),
    path.join(__dirname, 'middlewares', 'error-handler.middleware.ts'),
    path.join(__dirname, 'middlewares', 'rate-limiter.middleware.ts'),
    path.join(__dirname, 'middlewares', 'validator.middleware.ts')
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // 1. One-liner ifs with return void res...
    // e.g. `    if(!ok){return void res.sendStatus(500)}`
    // will become:
    // `    if (!ok) {`
    // `        res.sendStatus(500)`
    // `        return`
    // `    }`
    content = content.replace(/^(\s*)if\s*\((.*?)\)\s*\{\s*return\s+void\s+(res\.[^}]+?)\s*\}/gm, 
        '$1if ($2) {\n$1    $3\n$1    return\n$1}');

    // 2. Multiline block returns with return void res...
    // e.g. 
    // `    if (!refreshToken) {`
    // `        logger.debug(...)`
    // `        return void res.sendStatus(200)`
    // `    }`
    // will become:
    // `        res.sendStatus(200)`
    // `        return`
    content = content.replace(/^(\s*)return\s+void\s+(res\.[^;}\n]+)$/gm, 
        '$1$2\n$1return');

    // 3. For any remaining `res.xxx; return;` that might still exist due to user edits
    content = content.replace(/^(\s*)(res\.[^;}\n]+);\s*return;?$/gm, 
        '$1$2\n$1return');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Formatted', file);
});
