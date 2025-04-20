import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises'; // Use promises for async
import fg from 'fast-glob';
import matter from 'gray-matter'; // Keep gray-matter import for potential future use
import remarkMentionLinks from '../lib/remark-mention-links.mjs';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Project root is likely two levels up from src/integrations
const projectRoot = path.resolve(__dirname, '../../');
const contentDir = path.join(projectRoot, 'src', 'content');

// !! IMPORTANT !! -> Add all content collection names you want to resolve @mentions for.
// These should match the directory names under src/content/
const includedCollections = ['ski-areas', 'owners', 'passes', 'pass-families'];

export default function mentionLinksIntegration() {
    return {
        name: 'mention-links-integration',
        hooks: {
            // Use 'astro:config:setup' which runs earlier
            'astro:config:setup': async ({ config, updateConfig, command }) => {

                const siteBase = config.base || ''; // Use configured base or empty string

                /** @type {Record<string, string>} */
                const slugMap = {};
                /** @type {Record<string, string>} */
                const slugSourceCollection = {}; // To track the source collection for error messages

                console.log('[mention-links-integration] Starting to build slug map using file system...');

                for (const collectionName of includedCollections) {
                    const collectionPath = path.join(contentDir, collectionName);
                    // Use path.posix.join for glob pattern consistency across OS
                    const pattern = path.posix.join(collectionPath.replace(/\\/g, '/'), '**/*.md');

                    try {
                        const entries = await fg(pattern, { onlyFiles: true, absolute: true });

                        if (entries.length === 0) {
                            console.warn(`[mention-links-integration] Warning: No markdown files found in collection "${collectionName}" at path ${collectionPath}. Skipping.`);
                            continue;
                        }

                        for (const absoluteFilePath of entries) {
                            // Calculate slug relative to the specific collection directory
                            const relativeFilePath = path.relative(collectionPath, absoluteFilePath);
                            // Slug: remove .md extension, keep directory structure, use forward slashes
                            const fullSlug = relativeFilePath.replace(/\\/g, '/').replace(/\.md$/, '');

                            // Extract base slug (filename part)
                            const baseSlug = path.basename(fullSlug);

                            if (!baseSlug) {
                                console.warn(`[mention-links-integration] Warning: Could not extract base slug from "${fullSlug}" (derived from ${absoluteFilePath}) in collection "${collectionName}". Skipping.`);
                                continue;
                            }

                            if (slugMap.hasOwnProperty(baseSlug)) {
                                // Attempt to reconstruct the path for the existing entry for a clearer error message
                                let existingEntryPath = `unknown path in ${slugSourceCollection[baseSlug]}`;
                                const conflictingUrl = slugMap[baseSlug];
                                if (conflictingUrl) {
                                    const urlParts = conflictingUrl.split('/');
                                    if (urlParts.length > 1) { // Check if there's at least one '/' after the base
                                        const slugPart = urlParts.slice(urlParts.indexOf(collectionName)).join('/'); // Reconstruct slug from collection name onwards
                                        existingEntryPath = slugPart;
                                    }
                                }

                                const newEntryPath = `${collectionName}/${fullSlug}`;
                                console.error(
                                    `[mention-links-integration] Error: Duplicate base slug "@${baseSlug}" found. It is used by both "${existingEntryPath}" and "${newEntryPath}". Please ensure base filenames (like '${baseSlug}.md') are unique across all included collections.`
                                );
                                throw new Error(`Duplicate base slug "@${baseSlug}" detected.`);
                            }

                            // Construct the final URL path
                            const fullUrl = `${siteBase}/${collectionName}/${fullSlug}`;
                            slugMap[baseSlug] = fullUrl; // Map base slug to full URL
                            slugSourceCollection[baseSlug] = collectionName; // Track source using base slug
                        }
                    } catch (error) {
                        if (!error.message.includes('Duplicate base slug')) {
                            console.error(`[mention-links-integration] Error processing collection "${collectionName}":`, error);
                        }
                        throw error; // Halt the build on any error during map generation
                    }
                }

                console.log(`[mention-links-integration] Finished building slug map. Found ${Object.keys(slugMap).length} unique base slugs.`);

                // Update the Astro config (specifically markdown part)
                updateConfig({
                    markdown: {
                        remarkPlugins: [
                            ...(config.markdown?.remarkPlugins || []),
                            [remarkMentionLinks, { slugMap }] // Pass map to plugin
                        ],
                        rehypePlugins: config.markdown?.rehypePlugins || [],
                    },
                });
                console.log('[mention-links-integration] Integration setup complete.');
            }
        }
    };
}