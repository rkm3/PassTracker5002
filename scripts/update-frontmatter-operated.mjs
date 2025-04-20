import fs from 'fs/promises';
import path from 'path';
import { sync as globSync } from 'glob';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const skiAreasDir = path.resolve('src/content/ski-areas');
const files = globSync('**/*.md', { cwd: skiAreasDir, absolute: true });

async function updateFile(filePath) {
	try {
		const fileContent = await fs.readFile(filePath, 'utf-8');
		const { data: frontmatter, content: body } = matter(fileContent);
		let updated = false;
		const operatedData = {};

		if (frontmatter.hasOwnProperty('operating2425')) {
			// Assume presence means true, unless explicitly false/no
			operatedData['2425'] = !/^(no|false)$/i.test(String(frontmatter.operating2425));
			delete frontmatter.operating2425;
			updated = true;
		}

		if (frontmatter.hasOwnProperty('operated2324')) {
			operatedData['2324'] = !/^(no|false)$/i.test(String(frontmatter.operated2324));
			delete frontmatter.operated2324;
			updated = true;
		}

		if (updated) {
			// Only add the 'operated' field if we actually made changes
			if (Object.keys(operatedData).length > 0) {
				frontmatter.operated = operatedData;
			}

			// Ensure consistent YAML output (optional, but nice)
			const newYaml = yaml.dump(frontmatter, {
				sortKeys: (a, b) => { // Keep operated last if desired, otherwise sort alphabetically
					if (a === 'operated') return 1;
					if (b === 'operated') return -1;
					return a.localeCompare(b);
				},
				noRefs: true // Avoid YAML anchors/aliases if not needed
			});

			const newFileContent = `---
${newYaml}---

${body}`;
			await fs.writeFile(filePath, newFileContent, 'utf-8');
			console.log(`Updated: ${path.relative(process.cwd(), filePath)}`);
		} else {
			// console.log(`Skipped (no changes): ${path.relative(process.cwd(), filePath)}`);
		}

	} catch (error) {
		console.error(`Error processing file ${filePath}:`, error);
	}
}

async function runUpdates() {
	console.log(`Found ${files.length} markdown files in ${skiAreasDir}.`);
	if (files.length === 0) {
		console.log("No files found to update.");
		return;
	}

	const promises = files.map(updateFile);
	await Promise.all(promises);
	console.log("Finished updating frontmatter.");
}

runUpdates();