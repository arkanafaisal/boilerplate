const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'controllers'),
    path.join(__dirname, 'middlewares')
];

for (const dir of dirs) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (!file.endsWith('.ts')) continue;
        
        let content = fs.readFileSync(path.join(dir, file), 'utf8');

        // Fix the double newlines created by regex $1 matching the newline
        // We look for:
        // {
        // 
        //      res.status...
        //
        //      return
        //
        // }
        // We will replace `\n\r\n` or `\n\n` with just `\n` where it's around `res.` and `return` inside `if` block.
        content = content.replace(/\{\s*(res\.[^;}\n]+)\s*return\s*\}/g, (match, p1) => {
            // Find the indentation of the line before {
            // Actually, we can just replace the spacing blindly:
            return '{\n        ' + p1.trim() + '\n        return\n    }';
        });

        // The above replace might hardcode `    ` indent, which is fine for controllers, but let's be more dynamic or just use it since it's 4 spaces everywhere.
        // Wait, the `res...` might be further indented. Let's do a simpler regex:
        content = content.replace(/\{\s*\r?\n\s*\r?\n\s*(res\.[^\n]+?)\s*\r?\n\s*\r?\n\s*return\s*\r?\n\s*\r?\n\s*\}/g, '{\n        $1\n        return\n    }');

        // Wait, what if it's not inside `{ ... }` but at the end?
        // `res.status(...)\n\nreturn\n` -> `res.status(...)\nreturn\n`
        content = content.replace(/(res\.[^\n]+?)\s*\r?\n\s*\r?\n\s*return/g, '$1\n    return');

        fs.writeFileSync(path.join(dir, file), content, 'utf8');
        console.log('Fixed blanks in', path.join(dir, file));
    }
}
