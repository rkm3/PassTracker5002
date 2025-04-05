import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const skiAreasDir = path.join(path.dirname(__dirname), 'src/content/ski-areas');

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            processDirectory(fullPath);
        } else if (entry.name.endsWith('.md')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const { data, content: markdownContent } = matter(content);

            if (data.location) {
                // Parse the location string (e.g., "U.S. - Utah")
                const [country, state] = data.location.split(' - ');

                // Remove the old location field and add new fields
                delete data.location;
                data.country = country;
                data.state = state;

                // Write the updated content back to the file
                const updatedContent = matter.stringify(markdownContent, data);
                fs.writeFileSync(fullPath, updatedContent);

                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

// Start processing from the ski-areas directory
processDirectory(skiAreasDir);