import { z } from "zod";

const ChangeSchema = z.object({
  type: z.string(),
  content: z.string(),
});

export const ChangefeedReleaseSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.string(),
  changes: z.array(ChangeSchema),
});

export const ChangefeedResponseSchema = z.object({
  name: z.string(),
  releases: z.object({
    edges: z.array(
      z.object({
        node: ChangefeedReleaseSchema,
      })
    ),
  }),
});

export const ChangefeedGraphQLResultSchema = z.object({
  data: z.object({
    projectBySlugs: z.unknown(),
  }),
});
