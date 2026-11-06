import type { CalculationOptions } from "@/types/odds";

/** Model registry driving the settings screen and comparison table. */

export interface ModelConfig {
  value: CalculationOptions["model"] | "DIXON_COLES";
  label: string;
  description: string;
  available: boolean;
}

export const MODEL_OPTIONS: ModelConfig[] = [
  {
    value: "POISSON",
    label: "Poisson",
    description: "Independent constant scoring rate; mean = variance",
    available: true,
  },
  {
    value: "NEGATIVE_BINOMIAL",
    label: "Negative Binomial",
    description: "Handles overdispersion (heavier tails than Poisson)",
    available: true,
  },
  {
    value: "DIXON_COLES",
    label: "Dixon-Coles",
    description: "Low-score dependence adjustment",
    available: false,
  },
];

export interface MarginMethodConfig {
  value: CalculationOptions["marginMethod"];
  label: string;
  description: string;
}

export const MARGIN_METHODS: MarginMethodConfig[] = [
  {
    value: "MULTIPLICATIVE",
    label: "Multiplicative (default)",
    description: "Proportional scaling of raw implied probabilities",
  },
  {
    value: "ADDITIVE",
    label: "Additive",
    description: "Subtracts a share of the overround from each side",
  },
  {
    value: "POWER",
    label: "Power",
    description: "Raises raw probabilities to an exponent before renormalizing",
  },
];
