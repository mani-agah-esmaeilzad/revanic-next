// src/lib/experiments.ts
export type ExperimentVariantMap = Record<string, number>;

export interface ExperimentDefinition {
  id: string;
  variants: ExperimentVariantMap;
  description?: string;
}

const EXPERIMENT_DEFINITIONS: ExperimentDefinition[] = [
  {
    id: 'registration_cta',
    description: 'آزمایش برای تغییر متن دکمه ثبت‌نام',
    variants: {
      control: 0.5,
      social_proof: 0.5,
    },
  },
];

export function getExperimentDefinitions() {
  return EXPERIMENT_DEFINITIONS;
}

export function pickWeightedVariant(variants: ExperimentVariantMap, seed?: number) {
  const entries = Object.entries(variants);
  if (entries.length === 0) return 'control';

  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const normalizedSeed = seed !== undefined
    ? Math.abs(seed % Number.MAX_SAFE_INTEGER) / Number.MAX_SAFE_INTEGER
    : Math.random();
  const random = normalizedSeed * totalWeight;

  let cumulative = 0;
  for (const [variant, weight] of entries) {
    cumulative += weight;
    if (random < cumulative) {
      return variant;
    }
  }

  return entries[entries.length - 1][0];
}
