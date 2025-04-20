import { defineCollection, z } from 'astro:content';

const skiAreas = defineCollection({
	type: 'content',
	schema: z.object({
		country: z.string(),
		state: z.string(),
		mountain: z.string(),
		website: z.string().optional(),
		verticalDrop: z.string().optional(),
		skiableAcres: z.string().optional(),
		annualSnowfall: z.string().optional(),
		owner: z.string().optional(),
		passAffiliations: z.string().optional(),
		operated: z.record(z.string(), z.boolean().default(true)).optional(),
		surfaceLiftsOnly: z.string().optional(),
		openToPublic: z.string().optional(),
		skied: z.string().optional(),
		slug: z.string().optional(),
		elevationBase: z.number().nullable().optional(),
		elevationSummit: z.number().nullable().optional(),
		trailCount: z.number().nullable().optional(),
		trailPctBeginner: z.number().nullable().optional(),
		trailPctIntermediate: z.number().nullable().optional(),
		trailPctAdvanced: z.number().nullable().optional(),
		liftCount: z.number().nullable().optional(),
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

// Define the schema for the 'posts' collection
const postsCollection = defineCollection({
	type: 'content', // v2.5.0 and later
	schema: z.object({
		title: z.string(),
		// Expect an ISO datetime string and transform it to a Date object
		pubDate: z.string().datetime({ message: "Invalid datetime string! Must be UTC ISO8601" }).transform((str) => new Date(str)),
		url: z.string().url(),
		slug: z.string().optional(), // Make slug optional
		description: z.string(),
		tags: z.array(z.string()),
		changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'])
	})
});

// Export a single `collections` object containing all collections
export const collections = {
	posts: postsCollection,
	'ski-areas': skiAreas,
	'owners': owners,
	'pass-families': passFamilies,
	'passes': passes,
};
