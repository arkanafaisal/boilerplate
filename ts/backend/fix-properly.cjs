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
        
        if (file === 'auth.controller.js') {
            content = content.replace('export const authController = {}', 'export const authController: Record<string, any> = {}');
        }
        if (file === 'user.controller.js') {
            content = content.replace('export const userController = {}', 'export const userController: Record<string, any> = {}');
        }

        // 1. One liner if statements:
        // if(!id){return res.status(400).json({error: "wrong username, email or password"})}
        content = content.replace(/^(\s*)if\s*\((.*?)\)\s*\{\s*return\s+(res\..+?)\s*\}\s*$/gm, '$1if ($2) {\n$1    $3\n$1    return\n$1}');

        // 2. Multiline blocks ending in return res.something
        content = content.replace(/^(\s*)return\s+(res\.[^;\n]+?)\s*;?\s*$/gm, '$1$2\n$1return');

        const tsFile = file.replace('.js', '.ts');
        fs.writeFileSync(path.join(tsDir, tsFile), content, 'utf8');
        console.log('Fixed', path.join(tsDir, tsFile));
    }
}
