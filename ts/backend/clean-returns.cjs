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

    // 1. Fix the messed up `if (!cond) { res.status(...); return; }`
    // The previous script turned `if(!ok){return res.sendStatus(500)}` into `if (!ok) { res.sendStatus(500); return; }`
    // Let's turn it into `if(!ok){return void res.sendStatus(500)}` to match original spacing without semicolons.
    content = content.replace(/if\s*\(\s*(.*?)\s*\)\s*\{\s*(res\.[^;]+);\s*return;\s*\}/g, 'if($1){return void $2}');

    // 2. Fix the dangling ones like `res.status(400).json({error: "token invalid"}); return;` 
    // into `return void res.status(400).json({error: "token invalid"})`
    content = content.replace(/^(\s*)(res\.[^;}\n]+);\s*return;$/gm, '$1return void $2');

    // 3. For statements at the end of function where I just stripped `return`:
    // It currently is `    res.status(201).json({accessToken})`
    // We want to restore the `return` using `void` to be completely safe and identical:
    // `    return void res.status(201).json({accessToken})`
    // Since there are many res.json or res.sendStatus at the end, I'll regex it carefully.
    // Let's just find any `res.status` or `res.sendStatus` or `res.json` that is NOT preceded by `return ` or `return void `
    content = content.replace(/^(\s*)(res\.(?:status|sendStatus|json)\([^;}\n]+\))$/gm, '$1return void $2');

    // Also let's fix middlewares that I haven't touched yet but the user asked to review.
    // In auth.middleware.ts and others, there are `return res.status(...)` which cause TS errors if typed.
    // Wait, the middlewares haven't been typed with Promise<void> yet, but the user said:
    // "tapi coba review disemua file apakah ada error yang sama"
    // So let's replace all `return res.something(...)` with `return void res.something(...)` globally in these files.
    content = content.replace(/return\s+(res\.[^;}\n]+)$/gm, 'return void $1');
    content = content.replace(/return\s+(res\.[^;}\n]+)\}/g, 'return void $1}');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Cleaned', file);
});
