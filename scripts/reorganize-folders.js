import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(path.dirname(__dirname), 'src/content/ski-areas');

// Function to sanitize folder names
function sanitizeName(name) {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Process all files in the ski-areas directory
function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && entry.name.startsWith('u-s-')) {
            // This is a state directory like 'u-s-alabama'
            const state = entry.name.replace('u-s-', '');
            const newStateDir = path.join(baseDir, 'us', state);

            // Create the new state directory
            fs.mkdirSync(newStateDir, { recursive: true });

            // Move all files from the old state directory to the new one
            const stateFiles = fs.readdirSync(fullPath);
            for (const file of stateFiles) {
                const oldPath = path.join(fullPath, file);
                const newPath = path.join(newStateDir, file);
                fs.renameSync(oldPath, newPath);
            }

            // Remove the old directory
            fs.rmdirSync(fullPath);
        }
    }
}

// Create the base 'us' directory
const usDir = path.join(baseDir, 'us');
if (!fs.existsSync(usDir)) {
    fs.mkdirSync(usDir, { recursive: true });
}

// Start processing
processDirectory(baseDir);