import { defineCollection, z } from 'astro:content';

const skiAreas = defineCollection({
	type: 'content',
	schema: z.object({
		country: z.string(),
		state: z.string(),
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

const owners = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(),
		website: z.string().optional(),
		description: z.string().optional(),
		logo: z.string().optional(),
	}),
});

const passFamilies = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(),
		description: z.string().optional(),
		website: z.string().optional(),
		logo: z.string().optional(),
	}),
});

const passes = defineCollection({
	type: 'content',
	schema: z.object({
		name: z.string(),
		season: z.string(),
		passFamily: z.string().optional(),
		price: z.union([z.string(), z.number()]).optional(),
		earlyBirdPrice: z.union([z.string(), z.number()]).optional(),
		onSaleDate: z.union([z.string(), z.date()]).optional(),
		description: z.string().optional(),
		website: z.string().optional(),
		logo: z.string().optional(),
		resorts: z.array(
			z.object({
				name: z.string(),
				location: z.string(),
				days: z.union([z.string(), z.number()]),
			})
		).optional(),
	}),
});

export const collections = {
	'ski-areas': skiAreas,
	'owners': owners,
	'pass-families': passFamilies,
	passes: passes,
};