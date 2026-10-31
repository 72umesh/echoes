import { z } from "zod";

export const claimKindSchema = z.enum(["observed", "inferred", "unknown"]);

export const claimSchema = z.object({
  text: z.string(),
  kind: claimKindSchema,
  evidenceIds: z.array(z.string()).default([]),
});

export const revivalOpportunitySchema = z.object({
  title: z.string(),
  description: z.string(),
  kind: claimKindSchema,
  evidenceIds: z.array(z.string()).default([]),
});

export const analysisSchema = z.object({
  overview: z.object({
    summary: z.string(),
    claims: z.array(claimSchema),
  }),
  architecture: z.object({
    inferredFromFileTreeAndReadmeOnly: z.literal(true),
    explanation: z.string(),
    claims: z.array(claimSchema),
  }),
  history: z.object({
    timeline: z.string(),
    claims: z.array(claimSchema),
  }),
  currentState: z.object({
    healthSignals: z.string(),
    claims: z.array(claimSchema),
  }),
  revivalOpportunities: z.array(revivalOpportunitySchema),
  unknowns: z.array(z.string()).default([]),
});

export type ClaimKind = z.infer<typeof claimKindSchema>;
export type Claim = z.infer<typeof claimSchema>;
export type Analysis = z.infer<typeof analysisSchema>;

export const ANALYSIS_JSON_SHAPE = `{
  "overview": { "summary": "string", "claims": [{ "text": "string", "kind": "observed|inferred|unknown", "evidenceIds": ["readme-1"] }] },
  "architecture": { "inferredFromFileTreeAndReadmeOnly": true, "explanation": "string", "claims": [{ "text": "string", "kind": "inferred", "evidenceIds": ["file-1"] }] },
  "history": { "timeline": "string", "claims": [{ "text": "string", "kind": "observed", "evidenceIds": ["commit-1"] }] },
  "currentState": { "healthSignals": "string", "claims": [{ "text": "string", "kind": "inferred", "evidenceIds": ["issue-1"] }] },
  "revivalOpportunities": [{ "title": "string", "description": "string", "kind": "inferred", "evidenceIds": ["file-1"] }],
  "unknowns": ["string"]
}`;
