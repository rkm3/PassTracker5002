import { defineCollection, z } from 'astro:content';

const skiAreas = defineCollection({
	type: 'content',
	schema: z.object({
		location: z.string(),
		mountain: z.string(),
		verticalDrop: z.string().optional(),
		skiableAcres: z.string().optional(),
		annualSnowfall: z.string().optional(),
		owner: z.string().optional(),
		passAffiliations: z.string().optional(),
		operating2425: z.string().optional(),
		operated2324: z.string().optional(),
		surfaceLiftsOnly: z.string().optional(),
		openToPublic: z.string().optional(),
		skied: z.string().optional(),
		slug: z.string().optional(),
	}),
});

export const collections = {
	'ski-areas': skiAreas,
};