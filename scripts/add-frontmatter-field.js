import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url'; // Needed for __dirname equivalent in ESM

// Equivalent for __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

function addFrontmatterField(directoryPath, fieldName, defaultValue) {
    let foundCount = 0;
    let updatedCount = 0;
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Recurse into subdirectories
            const counts = addFrontmatterField(filePath, fieldName, defaultValue);
            foundCount += counts.found;
            updatedCount += counts.updated;
        } else if (stat.isFile() && path.extname(file) === '.md') {
            foundCount++;
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const { data: frontmatter, content, language, delimiters } = matter(fileContent);

                if (frontmatter && typeof frontmatter[fieldName] === 'undefined') {
                    frontmatter[fieldName] = defaultValue;

                    // Use detected delimiters or default
                    const outputDelimiters = delimiters ? delimiters : '---';

                    const finalContent = matter.stringify(content, frontmatter, {
                        delimiters: outputDelimiters, // Use detected or default delimiters
                        lineWidth: -1 // Prevent line wrapping
                    });

                    // Ensure a single trailing newline for consistency, unless the file was empty
                    const contentToWrite = finalContent.trim() ? finalContent.trimEnd() + '\n' : '';

                    fs.writeFileSync(filePath, contentToWrite, 'utf8');
                    console.log(`Updated: ${filePath} - Added field '${fieldName}'`);
                    updatedCount++;
                } else if (!frontmatter) {
                     console.warn(`Skipped: ${filePath} - No frontmatter found.`);
                } else {
                    // console.log(`Skipped: ${filePath} - Field '${fieldName}' already exists.`); // Optional: log skipped files
                }
            } catch (error) {
                console.error(`Error processing file ${filePath}:`, error);
            }
        }
    });
    return { found: foundCount, updated: updatedCount };
}

// --- Script Execution ---
const args = process.argv.slice(2);

if (args.length !== 3) {
    console.error('Usage: node scripts/add-frontmatter-field.js <directoryPath> <fieldName> <defaultValue>');
    process.exit(1);
}

const [directoryPath, fieldName, defaultValueStr] = args;

// Attempt to parse defaultValue if it looks like JSON (e.g., boolean, number, object)
let defaultValue;
try {
    defaultValue = JSON.parse(defaultValueStr);
} catch (e) {
    // If parsing fails, treat it as a string
    defaultValue = defaultValueStr;
}

const targetDirPath = path.resolve(directoryPath);

if (!fs.existsSync(targetDirPath) || !fs.statSync(targetDirPath).isDirectory()) {
    console.error(`Error: Directory not found or not a directory: ${targetDirPath}`);
    process.exit(1);
}

console.log(`Starting script in directory: ${targetDirPath}`);
console.log(`Adding field: '${fieldName}' with default value: ${JSON.stringify(defaultValue)}`);

const totalCounts = addFrontmatterField(targetDirPath, fieldName, defaultValue);

console.log('\n--- Script Summary ---');
console.log(`Total markdown files found: ${totalCounts.found}`);
console.log(`Total files updated:      ${totalCounts.updated}`);
console.log('Script finished.');