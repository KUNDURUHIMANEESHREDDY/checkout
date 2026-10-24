import { z } from "zod";
export const storyInputSchema=z.object({title:z.string().trim().min(8).max(120),slug:z.string().trim().min(3).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),dek:z.string().trim().min(20).max(280),categoryId:z.string().min(1),coverImage:z.string().url(),coverImageAlt:z.string().trim().min(10).max(240),readingMinutes:z.number().int().min(1).max(60),featured:z.boolean().default(false),paragraphs:z.array(z.string().trim().min(20).max(10000)).min(1).max(100)});
export type StoryInput=z.infer<typeof storyInputSchema>;
