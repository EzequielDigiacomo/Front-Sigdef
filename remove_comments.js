import fs from 'fs';
import path from 'path';

const rootDir = 'C:\\Users\\Trabajo-Desktop\\source\\ResposFront\\SIGDEF-Front';
const srcDir = path.join(rootDir, 'src');
const docsDir = path.join(rootDir, 'docs');

function removeJsComments(content) {
    // Regex to match strings, comments, and code
    // We want to replace comments but keep strings and code.

    return content.replace(/("([^"\\]|\\.)*")|('([^'\\]|\\.)*')|(`([^`\\]|\\.)*`)|(\/\/.*)|(\/\*[\s\S]*?\*\/)/g, (match, doubleQuoted, dqc, singleQuoted, sqc, backTick, btc, lineComment, blockComment) => {
        if (doubleQuoted || singleQuoted || backTick) {
            return match; // Keep strings
        }
        if (lineComment) {
            // Remove all line comments
            return '';
        }
        if (blockComment) {
            // Keep if it looks like a file header or component description
            // Heuristic: starts with /** and contains "Component", "Page", "Title" or is at the very start of the file (we can't easily check start of file here without context, but usually headers are distinct)
            if (match.startsWith('/**') && (match.includes('Component') || match.includes('Page') || match.includes('Title') || match.includes('@file') || match.includes('@author'))) {
                return match;
            }
            return '';
        }
        return match;
    });
}

function removeCssComments(content) {
    return content.replace(/(\/\*[\s\S]*?\*\/)/g, (match) => {
        // Keep if it looks like a section header e.g. /* --- Header --- */
        if (match.includes('---') || match.includes('===')) {
            return match;
        }
        return '';
    });
}

function removeMdComments(content) {
    // Remove HTML comments
    return content.replace(/<!--[\s\S]*?-->/g, '');
}

function processFile(filePath) {
    const ext = path.extname(filePath);
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;

    if (['.js', '.jsx'].includes(ext)) {
        newContent = removeJsComments(content);
        // Clean up multiple empty lines left by comment removal
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    } else if (['.css'].includes(ext)) {
        newContent = removeCssComments(content);
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    } else if (['.md'].includes(ext)) {
        // Skip generated folder
        if (filePath.includes('docs\\generated')) return;
        newContent = removeMdComments(content);
    }

    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Processed: ${filePath}`);
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            processFile(filePath);
        }
    });
}

console.log('Starting comment removal...');
walkDir(srcDir);
walkDir(docsDir);
console.log('Done.');
