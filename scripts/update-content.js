import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(path.dirname(__dirname), 'src/content/ski-areas');

// Process all files in the ski-areas directory
function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data, content: markdownContent } = matter(content);

            // Update the content to use the new location format
            const updatedContent = markdownContent.replace(
                /Located in .+?,/,
                `Located in ${data.country} - ${data.state},`
            );

            // Write the updated content back to the file
            const updatedFile = matter.stringify(updatedContent, data);
            fs.writeFileSync(fullPath, updatedFile);

            console.log(`Updated content in ${fullPath}`);
        }
    }
}

// Start processing
processDirectory(baseDir);