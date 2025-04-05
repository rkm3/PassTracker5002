// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	integrations: [tailwind()],
	content: {
		collections: [
			{
				name: 'ski-areas',
				directory: 'src/content/ski-areas',
			},
		],
	},
	site: 'https://rkm3.github.io',
	base: '/PassTracker5002',
});
