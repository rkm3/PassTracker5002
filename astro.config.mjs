// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [],
	content: {
		collections: [
			{
				name: 'ski-areas',
				directory: 'src/content/ski-areas',
			},
		],
	},
});
