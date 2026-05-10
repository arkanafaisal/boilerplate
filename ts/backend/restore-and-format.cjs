const fs = require('fs');
const path = require('path');

const jsDirs = [
    path.join(__dirname, '..', '..', 'js', 'backend', 'controllers'),
    path.join(__dirname, '..', '..', 'js', 'backend', 'middlewares')
];
const tsDirs = [
    path.join(__dirname, 'controllers'),
    path.join(__dirname, 'middlewares')
];

for (let i = 0; i < jsDirs.length; i++) {
    const jsDir = jsDirs[i];
    const tsDir = tsDirs[i];
    
    const files = fs.readdirSync(jsDir);
    for (const file of files) {
        if (!file.endsWith('.js')) continue;
        
        let content = fs.readFileSync(path.join(jsDir, file), 'utf8');
        
        // Let's add the TS type to authController and userController since they were complaining
        if (file === 'auth.controller.js') {
            content = content.replace('export const authController = {}', 'export const authController: Record<string, any> = {}');
        }
        if (file === 'user.controller.js') {
            content = content.replace('export const userController = {}', 'export const userController: Record<string, any> = {}');
        }

        // Fix the one-liner if statements: if(!ok){return res.sendStatus(500)}
        // ->
        // if (!ok) {
        //     res.sendStatus(500)
        //     return
        // }
        // We match `if(cond){return res.func(args)}`
        // We must be careful about nested braces. Since these are simple one-liners, it's fairly easy.
        content = content.replace(/^(\s*)if\s*\((.*?)\)\s*\{\s*return\s+(res\.[^;]+?)\s*\}/gm, '$1if ($2) {\n$1    $3\n$1    return\n$1}');

        // For `return res.status(...)` not inside a simple one-liner if.
        // It could be multiline if block, e.g. 
        // if (!id) {
        //     logger...
        //     return res.status(400)
        // }
        content = content.replace(/^(\s*)return\s+(res\.[^;}\n]+)$/gm, '$1$2\n$1return');

        // Note: the above regexes only add `return` on the next line if the line was literally `return res.something(...)`.
        
        const tsFile = file.replace('.js', '.ts');
        fs.writeFileSync(path.join(tsDir, tsFile), content, 'utf8');
        console.log('Restored and formatted', path.join(tsDir, tsFile));
    }
}
