#!/usr/bin/env node

import fs, { constants } from 'fs/promises';
import path from 'path';
import { XMLParser } from 'fast-xml-parser';
import yaml from 'js-yaml';

const SITEMAP_URL = 'https://www.stormskiing.com/sitemap.xml';
const POSTS_DIR = path.resolve(process.cwd(), 'src/content/posts');
const URL_PREFIX = 'https://www.stormskiing.com/p/';

// Helper function to derive title from slug
function deriveTitleFromSlug(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function generatePosts() {
  console.log(`Fetching sitemap from ${SITEMAP_URL}...`);
  // 1. Fetch the XML sitemap
  const response = await fetch(SITEMAP_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }
  const xmlData = await response.text();

  // 2. Parse the XML
  console.log('Parsing XML...');
  const parser = new XMLParser({
      ignoreAttributes: false,
      processNSPrefix: true,
      isArray: (tagName, jPath, isLeafNode, isAttribute) => {
          return jPath === "urlset.url";
      }
  });
  const sitemap = parser.parse(xmlData);

  // Add more robust checking for the url array
  if (!sitemap.urlset || !Array.isArray(sitemap.urlset.url)) {
      throw new Error('Invalid sitemap format or <url> elements not found/parsed as an array.');
  }

  const urls = sitemap.urlset.url; // Now guaranteed to be an array by the isArray option or the check above

  // 3. Ensure the output directory exists
  console.log(`Ensuring output directory exists: ${POSTS_DIR}`);
  await fs.mkdir(POSTS_DIR, { recursive: true });

  // 4. Filter URLs and process each one
  let postsCreated = 0;
  console.log(`Processing ${urls.length} URLs...`);
  for (const urlEntry of urls) {
    const loc = urlEntry.loc;

    if (loc && typeof loc === 'string' && loc.startsWith(URL_PREFIX)) {
      const urlPath = loc.substring(URL_PREFIX.length);
      const slug = path.basename(urlPath).replace(/\.html$/, ''); // Basic slug generation
      const pubDate = urlEntry.lastmod ? new Date(urlEntry.lastmod).toISOString() : new Date().toISOString();
      const changefreq = urlEntry.changefreq || 'monthly'; // Default if missing
      const title = deriveTitleFromSlug(slug); // Use slug as placeholder title

      const frontmatter = {
        title: title,
        pubDate: pubDate,
        url: loc,
        slug: slug,
        description: '', // Placeholder
        tags: [], // Placeholder
        changefreq: changefreq
      };

      const yamlFrontmatter = yaml.dump(frontmatter);
      const markdownContent = `---
${yamlFrontmatter}---

<!-- Add post content below -->
`;
      const filePath = path.join(POSTS_DIR, `${slug}.md`);

      try {
        // Check if the file already exists
        await fs.access(filePath, constants.F_OK);
        // If fs.access does not throw, the file exists
        console.log(`Skipped (already exists): ${filePath}`);
      } catch (accessErr) {
        // If fs.access throws an error, check if it's because the file doesn't exist
        if (accessErr.code === 'ENOENT') {
          try {
            // File does not exist, proceed to write
            await fs.writeFile(filePath, markdownContent);
            console.log(`Created: ${filePath}`);
            postsCreated++;
          } catch (writeErr) {
            console.error(`Failed to write file ${filePath}:`, writeErr);
          }
        } else {
          // Another error occurred during the access check (e.g., permissions)
          console.error(`Error checking file ${filePath}:`, accessErr);
        }
      }
    }
  }

  console.log(`Post generation process completed. ${postsCreated} posts created in ${POSTS_DIR}.`);
}

generatePosts().catch(error => {
  console.error('Error generating posts:', error);
  process.exit(1);
});