import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  icp: z.object({
    industries: z.string(),
    geographies: z.string(),
    keywords: z.string().optional(),
    size_range: z.string(),
    description: z.string().min(1, "ICP description is required"),
  }),
  personas: z.array(z.object({
    title: z.string(),
    seniority: z.string().optional(),
    department: z.string().optional()
  })),
  business_rules: z.array(z.object({
    rule_type: z.string(),
    description: z.string(),
    is_strict: z.boolean().default(true)
  }))
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
