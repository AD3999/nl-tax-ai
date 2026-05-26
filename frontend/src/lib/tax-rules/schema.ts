import { z } from "zod";

const RULE_ID_REGEX = /^[A-Z0-9]+-\d{4}-\d{3}$/;

export const taxBracketSchema = z.object({
  from: z.number().min(0),
  to: z.number().nullable(),
  rate: z.number().min(0).max(100),
  label: z.string().optional(),
});

export const phaseOutSchema = z.object({
  income_start: z.number().min(0),
  income_end: z.number().min(0),
  max_credit: z.number().min(0),
  reduction_per_euro: z.number().optional(),
});

export const ruleConditionSchema = z.object({
  is_entrepreneur: z.boolean().optional(),
  hours_gte: z.number().min(0).optional(),
  hours_lt: z.number().min(0).optional(),
  income_lte: z.number().min(0).optional(),
  income_gte: z.number().min(0).optional(),
  profit_gte: z.number().min(0).optional(),
  user_type: z.enum(["zzp", "employee", "expat", "dga", "accountant", "all"]).optional(),
  has_child_under_12: z.boolean().optional(),
  is_aow_age: z.boolean().optional(),
  is_starter: z.boolean().optional(),
  shareholding_pct_gte: z.number().min(0).max(100).optional(),
  assets_gte: z.number().min(0).optional(),
}).passthrough();

export const ruleResultSchema = z.object({
  type: z.enum(["fixed_amount", "percentage", "bracket", "formula", "cap", "threshold", "phase_out", "boolean", "date"]),
  value: z.number().optional(),
  unit: z.enum(["pct", "eur", "hours", "date", "string"]).optional(),
  formula: z.string().optional(),
  cap: z.number().optional(),
  threshold: z.number().optional(),
  brackets: z.array(taxBracketSchema).optional(),
  phase_out: phaseOutSchema.optional(),
  notes: z.string().optional(),
});

export const taxRuleSchema = z.object({
  id: z.string().regex(RULE_ID_REGEX, "ID must follow TOPIC-YEAR-SEQ format (e.g. ZA-2026-001)"),
  year: z.number().int().min(2020).max(2030),
  topic: z.string().min(2).max(80),
  category: z.enum(["bracket", "deduction", "credit", "contribution", "exemption", "rate", "deadline", "compliance", "detection", "benefit"]),
  user_types: z.array(z.enum(["zzp", "employee", "expat", "dga", "accountant", "all"])).min(1),
  condition: ruleConditionSchema,
  result: ruleResultSchema,
  plain_nl: z.string().min(1, "Dutch explanation is required"),
  plain_en: z.string().min(1, "English explanation is required"),
  plain_fa: z.string().min(1, "Persian explanation is required"),
  source_url: z.string().url("Must be a valid URL"),
  verification_status: z.enum(["verified", "pending_review", "draft", "expired"]),
  effective_from: z.string().min(1, "Effective from date is required"),
  effective_until: z.string().nullable(),
  ai_prompt_hint: z.string(),
  tags: z.array(z.string()),
  supersedes: z.string().optional(),
}).superRefine((data, ctx) => {
  // Year in ID must match year field
  const idYear = parseInt(data.id.split("-")[1]);
  if (!isNaN(idYear) && idYear !== data.year) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Year in ID (${idYear}) must match year field (${data.year})`, path: ["id"] });
  }
  // Verified rules need source_url + all translations
  if (data.verification_status === "verified") {
    if (!data.source_url) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Source URL required for verified rules", path: ["source_url"] });
    if (!data.plain_nl) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Dutch explanation required for verified rules", path: ["plain_nl"] });
    if (!data.plain_en) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "English explanation required for verified rules", path: ["plain_en"] });
    if (!data.plain_fa) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Persian explanation required for verified rules", path: ["plain_fa"] });
    if (!data.effective_from) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Effective from date required for verified rules", path: ["effective_from"] });
  }
});

export type TaxRuleFormValues = z.infer<typeof taxRuleSchema>;
