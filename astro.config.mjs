// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mentionLinksIntegration from './src/integrations/mention-links-integration.mjs';

// Define siteBase here if needed elsewhere, otherwise it can be removed if only used for slug map
const siteBase = '/PassTracker5002';

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		mentionLinksIntegration()
	],
	site: 'https://rkm3.github.io',
	base: siteBase, // Use the defined base variable
	vite: {
		build: {
			rollupOptions: {
				external: ['sharp']
			}
		}
	}
});
