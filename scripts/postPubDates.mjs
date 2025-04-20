import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

const contentDir = path.join(process.cwd(), 'src', 'content', 'posts');
const dataDir = path.join(process.cwd(), 'src', 'data');
const outputFile = path.join(dataDir, 'postPubDates.json');

async function generatePostPubDates() {
  console.log(`[postPubDates] Scanning content directory: ${contentDir}`);
  const postFiles = await glob('**/*.{md,mdx}', { cwd: contentDir, absolute: true, nodir: true });
  console.log(`[postPubDates] Found ${postFiles.length} post files.`);

  const pubDatesMap = {};

  for (const filePath of postFiles) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter } = matter(fileContent);

      let pubDateValue = null;
      if (frontmatter && frontmatter.pubDate) {
        if (typeof frontmatter.pubDate === 'string') {
          pubDateValue = frontmatter.pubDate;
        } else if (frontmatter.pubDate instanceof Date) {
          pubDateValue = frontmatter.pubDate.toISOString();
        }
      } else if (frontmatter && frontmatter.date) { // Fallback check for 'date'
        if (typeof frontmatter.date === 'string') {
          pubDateValue = frontmatter.date;
        } else if (frontmatter.date instanceof Date) {
          pubDateValue = frontmatter.date.toISOString();
        }
      }

      // Determine the slug/URL path
      let slug = frontmatter.slug;
      if (!slug || typeof slug !== 'string') {
        slug = path.basename(filePath, path.extname(filePath)); // Fallback to filename
        console.warn(`[postPubDates] Missing 'slug' in frontmatter for ${path.relative(process.cwd(), filePath)}. Using filename: ${slug}`);
      }

      const canonicalUrl = `/posts/${slug}`; // Astro's typical post URL structure

      if (pubDateValue) {
        if (pubDatesMap[canonicalUrl]) {
           console.warn(`[postPubDates] Duplicate URL found for slug '${slug}' from file ${path.relative(process.cwd(), filePath)}. Overwriting previous entry.`);
        }
        pubDatesMap[canonicalUrl] = pubDateValue;
      } else {
        console.warn(`[postPubDates] Missing 'pubDate' or 'date' in frontmatter for ${path.relative(process.cwd(), filePath)} (slug: ${slug}). Skipping.`);
      }

    } catch (error) {
      console.error(`[postPubDates] Error processing file ${filePath}:`, error);
    }
  }

  // Ensure data directory exists
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    console.error(`[postPubDates] Error creating data directory: ${dataDir}`, err);
    return; // Stop if we can't create the directory
  }

  // Write the JSON file
  try {
    await fs.writeFile(outputFile, JSON.stringify(pubDatesMap, null, 2));
    console.log(`[postPubDates] Successfully wrote post publication dates to ${outputFile}`);
    console.log(`[postPubDates] Total entries written: ${Object.keys(pubDatesMap).length}`);
  } catch (error) {
    console.error(`[postPubDates] Error writing postPubDates file:`, error);
  }
}

generatePostPubDates();