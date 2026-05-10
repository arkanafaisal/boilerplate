const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'controllers', 'auth.controller.ts'),
    path.join(__dirname, 'controllers', 'user.controller.ts')
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Remove Promise<any> from asyncHandler
    content = content.replace(/asyncHandler\(async \(req, res\): Promise<any> =>/g, 'asyncHandler(async (req, res) =>');

    // 2. Replace one-liner if returns: if(cond){return res.something()}
    // Regex matches `if(...){return res.something()}`
    content = content.replace(/if\s*\((.*?)\)\s*\{\s*return\s+(res\.[^}]+?)\s*\}/g, 'if ($1) { $2; return; }');

    // 3. Replace isolated return res... 
    // This looks for `return res.status(...).json(...)` or `return res.sendStatus(...)`
    // We'll replace it with `res.status(...).json(...); return;` unless it's the very last statement before `})`
    // To be safe, we just convert ALL `return res.xxx(...)` to `res.xxx(...); return;` 
    // Express 5 or typescript doesn't care if there's a dangling return at the end.
    
    // Actually, for lines like:
    //    return res.status(201).json({accessToken})
    // -> res.status(201).json({accessToken}); return;
    
    // We can do this with a global regex:
    // match `return res.([^;}\n]+)`
    content = content.replace(/^(\s*)return\s+(res\.[^;}\n]+);?$/gm, '$1$2; return;');

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
});
