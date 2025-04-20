import { visit } from 'unist-util-visit';

// Define the plugin function, accepting options (specifically the slugMap)
export default function remarkMentionLinks(options) {
  const { slugMap } = options || {};

  if (!slugMap) {
    console.warn('[remark-mention-links] Warning: No slugMap provided. @mentions will not be resolved.');
    // Return an empty transformer if no map is provided
    return () => {};
  }

  // Return the transformer function that operates on the AST (tree)
  return (tree, file) => {
    visit(tree, 'link', (node) => {
      // Check if the link URL starts with '@'
      if (node.url && node.url.startsWith('@')) {
        const slug = node.url.substring(1); // Extract slug (remove '@')

        // Look up the slug in the map
        const resolvedUrl = slugMap[slug];

        if (resolvedUrl) {
          // If found, update the node's URL
          node.url = resolvedUrl;
        } else {
          // If not found, THROW AN ERROR to fail the build
          throw new Error(`[remark-mention-links] Error: Could not resolve mention "@${slug}" in file "${file.path}". Please check the mention or ensure the corresponding file exists with a unique base filename.`);
        }
      }
    });
  };
}