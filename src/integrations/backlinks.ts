import type { AstroIntegration, RouteData } from 'astro';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio'; // Import as namespace
import { glob } from 'glob'; // Import glob

interface BacklinksIntegrationOptions {
  // Add options if needed later
}

// Define the structure for storing backlinks with titles
interface BacklinkEntry {
  url: string;
  title: string;
}

export default function backlinks(options?: BacklinksIntegrationOptions): AstroIntegration {
  let outDir: URL;
  let rootDir: URL;
  let base: string;
  const dataDir = new URL('../data/', import.meta.url);
  const backlinksFile = new URL('backlinks.json', dataDir);

  // Helper function to normalize URL paths (remove base, handle trailing slash, decode)
  const normalizeUrlPath = (pathname: string): string => {
    let normalized = pathname;
    // Remove base
    if (base !== '/' && normalized.startsWith(base)) {
      normalized = normalized.substring(base.length -1); // Keep leading slash
      if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
      }
    }
    // Decode URI
    try {
        normalized = decodeURI(normalized);
    } catch (e) {
        console.warn(`[backlinks] Failed to decode URI: ${pathname}`, e);
        // Keep original if decoding fails
    }
    // Handle trailing slash (remove unless it's the root path)
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
     // Ensure leading slash
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }
    return normalized;
  };

  // Helper function to get the expected absolute file path for a given pathname
  const getAbsoluteFilePath = (pathname: string): string | null => {
    try {
      // Store original ending slash info before normalizing
      const originalEndsWithSlash = pathname.endsWith('/');
      // Normalize (removes base, handles trailing slash, decodes)
      const normalizedPath = normalizeUrlPath(pathname); // e.g., /countries/usa/wyoming or /

      // Remove leading slash for joining
      let relativePath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath; // e.g., countries/usa/wyoming or ""

      let outputFilePath: string;

      // Check if it represents the root directory
      if (relativePath === '') {
         outputFilePath = 'index.html';
      }
      // Check if it has a file extension (e.g., /assets/image.png)
      // Page routes usually don't have extensions in route.pathname
      else if (path.extname(relativePath)) {
         outputFilePath = relativePath;
      }
      // Otherwise (e.g., /foo, /bar/baz), treat it as a directory path
      else {
         outputFilePath = path.join(relativePath, 'index.html');
      }

      const filePath = fileURLToPath(new URL(outputFilePath, outDir));
      return filePath;
    } catch (e) {
      console.error(`[backlinks] Error creating file path for pathname: ${pathname}`, e);
      return null;
    }
  };


  return {
    name: 'astro-backlinks-generator',
    hooks: {
      'astro:config:setup': async ({ config }) => {
        console.log('[backlinks] Setting up...');
        outDir = config.outDir;
        rootDir = config.root;
        base = config.base.endsWith('/') ? config.base : config.base + '/'; // Ensure trailing slash for base
        console.log(`[backlinks] Configured with: outDir=${fileURLToPath(outDir)}, root=${fileURLToPath(rootDir)}, base=${base}`);

        // Ensure data directory exists
        try {
            await fs.mkdir(fileURLToPath(dataDir), { recursive: true });
        } catch (err) {
            console.error(`[backlinks] Error creating data directory: ${fileURLToPath(dataDir)}`, err);
        }
      },

      'astro:build:done': async ({ routes, pages, dir }) => {
        // Note: We are now using `dir` (the output directory URL) instead of relying on `routes`
        console.log(`[backlinks] Build done. Output directory: ${fileURLToPath(dir)}`);
        const builtFilePathsSet = new Set<string>();
        // Update Map value type to store Map of BacklinkEntry objects, keyed by source URL
        const backlinksMap = new Map<string, Map<string, BacklinkEntry>>();
        const outDirString = fileURLToPath(dir);

        // --- Pass 1: Collect Built File Paths using Glob ---
        console.log('[backlinks] Pass 1: Scanning output directory for HTML files...');
        try {
          // Find all .html files in the output directory
          const htmlFiles = await glob('**/*.html', { cwd: outDirString, absolute: true, nodir: true });
          htmlFiles.forEach(filePath => builtFilePathsSet.add(path.normalize(filePath)));
          console.log(`[backlinks] Pass 1: Found ${htmlFiles.length} HTML files.`);
          // console.log('[backlinks] Pass 1: Found Files: ', Array.from(builtFilePathsSet));
        } catch (err) {
            console.error('[backlinks] Pass 1: Error scanning output directory:', err);
            return; // Cannot proceed if we can't find files
        }

        if (builtFilePathsSet.size === 0) {
             console.warn('[backlinks] Pass 1: No HTML files found in output directory. Skipping backlink generation.');
             return;
        }

        // --- Pass 2: Process Links ---
         console.log('[backlinks] Pass 2: Processing links in found HTML files...');
         for (const sourceAbsoluteFilePath of builtFilePathsSet) {
            // We need to derive the canonical URL from the file path now
            let relativePath = path.relative(outDirString, sourceAbsoluteFilePath);
            // Convert windows paths
            relativePath = relativePath.replace(/\\/g, '/');
            // Remove index.html
            if (relativePath.endsWith('index.html')) {
                relativePath = relativePath.substring(0, relativePath.length - 'index.html'.length);
            }
            // Remove trailing slash if not root
            if (relativePath.length > 0 && relativePath.endsWith('/')) {
                 relativePath = relativePath.slice(0, -1);
            }
            // Ensure leading slash
            const sourcePathname = '/' + relativePath;
            let sourceCanonicalUrl = normalizeUrlPath(sourcePathname);

            // Normalize /usa/ to /us/
            if (sourceCanonicalUrl.startsWith('/ski-areas/usa/')) {
                sourceCanonicalUrl = sourceCanonicalUrl.replace('/ski-areas/usa/', '/ski-areas/us/');
            }

            try {
              const htmlContent = await fs.readFile(sourceAbsoluteFilePath, 'utf-8');
              const $ = cheerio.load(htmlContent);

              // Extract the source page title
              const sourceTitle = $('title').first().text().trim() || sourceCanonicalUrl; // Use URL as fallback title

              $('a[href]').each((_: number, el: cheerio.Element) => {
                const href = $(el).attr('href');
                if (!href) return;

                // Basic filtering for non-internal links
                if (href.startsWith('http:') || href.startsWith('https:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#') || href.startsWith('javascript:')) {
                  return;
                }

                try {
                  // Resolve the relative href to an absolute path using the source page's URL context
                  // We need the full source URL including the base to resolve correctly
                  const sourceUrlForResolution = new URL(sourcePathname.startsWith('/') ? sourcePathname.substring(1) : sourcePathname, `http://localhost${base}`).toString();
                  const resolvedUrl = new URL(href, sourceUrlForResolution);
                  const resolvedPathname = resolvedUrl.pathname; // This should now be absolute path like /PassTracker5002/path/to/page

                  // Calculate the potential target file path on the filesystem
                  const potentialTargetFilePath = getAbsoluteFilePath(resolvedPathname);

                  // Check if the target file actually exists in our built set
                   if (potentialTargetFilePath && builtFilePathsSet.has(path.normalize(potentialTargetFilePath))) { // Normalize for comparison
                    let targetCanonicalUrl = normalizeUrlPath(resolvedPathname);

                    // Normalize /usa/ to /us/
                    if (targetCanonicalUrl.startsWith('/ski-areas/usa/')) {
                        targetCanonicalUrl = targetCanonicalUrl.replace('/ski-areas/usa/', '/ski-areas/us/');
                    }


                    // Safety check: Ensure we have valid url and title
                    if (typeof sourceCanonicalUrl !== 'string' || typeof sourceTitle !== 'string') {
                        console.warn(`[backlinks] Skipping backlink due to invalid source data. Source URL: ${sourceCanonicalUrl}, Source Title: ${sourceTitle}, Target URL: ${targetCanonicalUrl}`);
                        return; // Use return to skip this .each() iteration
                    }

                    // Add to backlinks map - store object with url and title, keyed by source url
                    if (!backlinksMap.has(targetCanonicalUrl)) {
                      backlinksMap.set(targetCanonicalUrl, new Map<string, BacklinkEntry>());
                    }
                    // Use sourceCanonicalUrl as the key to ensure uniqueness per source page
                    backlinksMap.get(targetCanonicalUrl)?.set(sourceCanonicalUrl, { url: sourceCanonicalUrl, title: sourceTitle });
                  } else {
                      // console.log(`[backlinks]   Skipping link: ${href} -> Resolved: ${resolvedPathname}. Target file ${potentialTargetFilePath} not in built set.`);
                  }
                } catch (e) {
                   console.warn(`[backlinks] Error resolving or processing link '${href}' on page ${sourceCanonicalUrl}:`, e);
                }
              });
            } catch (error) {
              console.error(`[backlinks] Error reading or parsing file ${sourceAbsoluteFilePath}:`, error);
            }
        }

        // --- Finalize: Convert Map to JSON and Write ---
        console.log('[backlinks] Finalizing backlinks...');
        // Add /countries/usa to the exclusion set
        const excludedUrls = new Set(['/', '/countries', '/ski-areas/usa', '/owners', '/resorts', '/countries/usa']);
        // Update output type
        const backlinksOutput: Record<string, BacklinkEntry[]> = {};
         for (const [targetUrl, sourceEntriesMap] of backlinksMap.entries()) {
            if (excludedUrls.has(targetUrl)) {
                continue;
            }

            // Extract values (BacklinkEntry objects) from the inner map
            const sourceEntriesArray = Array.from(sourceEntriesMap.values());

            // Filter source entries based on the exclusion list (checking the URL property)
            const filteredSourceEntries = sourceEntriesArray
                .filter(entry => !excludedUrls.has(entry.url));

            if (filteredSourceEntries.length > 0) {
                 // Sort filtered entries by title for user-friendliness
                 backlinksOutput[targetUrl] = filteredSourceEntries.sort((a, b) => a.title.localeCompare(b.title));
            }
         }

         // Debug: Log the final structure before writing
         // console.log('[backlinks] Final structure to write:', JSON.stringify(backlinksOutput, null, 2)); // Re-commented

         try {
           await fs.writeFile(fileURLToPath(backlinksFile), JSON.stringify(backlinksOutput, null, 2));
           console.log(`[backlinks] Successfully wrote backlinks to ${fileURLToPath(backlinksFile)}`);
         } catch (error) {
           console.error(`[backlinks] Error writing backlinks file:`, error);
         }
      },
    },
  };
}