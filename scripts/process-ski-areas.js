import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvFilePath = path.join(__dirname, '../PassTracker5001/Pass Tracker 5001 - National - ACTIVE U.S. SKI AREAS 2024-25.csv');
const csvContent = fs.readFileSync(csvFilePath, 'utf8');

// Parse the CSV content
const records = parse(csvContent, {
  columns: false,
  skip_empty_lines: true,
  trim: true
});

// Get the column names from the second row (index 1)
const columns = [
  'LOCATION',
  'MOUNTAIN',
  'VERTICAL_DROP',
  'SKIABLE_ACRES',
  'ANNUAL_SNOWFALL',
  'OWNER',
  'PASS_AFFILIATIONS',
  'OPERATING_2425',
  'OPERATED_2324',
  'SURFACE_LIFTS_ONLY',
  'OPEN_TO_PUBLIC',
  'SKIED'
];

// Base directory for markdown files
const baseDir = path.join(__dirname, '../src/content/ski-areas');

// Process each record starting from row 3 (index 2)
let currentLocation = '';
for (let i = 2; i < records.length; i++) {
  const record = records[i];

  // Skip if no mountain name
  if (!record[1]) continue;

  // Update current location if a new one is provided
  if (record[0]) {
    currentLocation = record[0];
  }

  // Skip if no location
  if (!currentLocation) continue;

  const mountain = record[1];

  // Create a sanitized location directory name
  const locationDir = currentLocation.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const locationPath = path.join(baseDir, locationDir);

  // Create the location directory if it doesn't exist
  if (!fs.existsSync(locationPath)) {
    fs.mkdirSync(locationPath, { recursive: true });
  }

  // Create a sanitized mountain filename
  const mountainName = mountain.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const filePath = path.join(locationPath, `${mountainName}.md`);

  // Create frontmatter
  const frontmatter = [
    '---',
    `location: "${currentLocation}"`,
    `mountain: "${mountain}"`,
    `verticalDrop: "${record[2] || ''}"`,
    `skiableAcres: "${record[3] || ''}"`,
    `annualSnowfall: "${record[4] || ''}"`,
    `owner: "${record[5] || ''}"`,
    `passAffiliations: "${record[6] || ''}"`,
    `operating2425: "${record[7] || ''}"`,
    `operated2324: "${record[8] || ''}"`,
    `surfaceLiftsOnly: "${record[9] || ''}"`,
    `openToPublic: "${record[10] || ''}"`,
    `skied: "${record[11] || ''}"`,
    '---',
    '',
    `# ${mountain}`,
    '',
    `Located in ${currentLocation}, ${mountain} is a ski area with a vertical drop of ${record[2] || 'N/A'} feet and ${record[3] || 'N/A'} skiable acres.`
  ].join('\n');

  // Write the file
  fs.writeFileSync(filePath, frontmatter);
  console.log(`Created: ${filePath}`);
}

console.log('Processing complete!');