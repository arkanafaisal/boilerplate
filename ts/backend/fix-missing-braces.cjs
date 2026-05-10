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

    // Remove double blank lines to fix spacing
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Fix missing `})` for JSON responses
    // Find something like:
    // res.status(400).json({error: "wrong username, email or password"
    //         return
    content = content.replace(/(res\.status\(\d+\)\.json\(\{[^}]+?)(?=\s*\n\s*return)/g, '$1})');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed syntax in', file);
});
