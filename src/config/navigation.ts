/** Sidebar / routing configuration. Icons are key strings mapped in the UI. */

export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon: "dashboard" | "analyzer" | "value" | "goal" | "score" | "match" | "history" | "settings";
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overall analysis overview",
    icon: "dashboard",
  },
  {
    href: "/analyzer",
    label: "Odds Analyzer",
    description: "Enter bookmaker odds",
    icon: "analyzer",
  },
  {
    href: "/value",
    label: "Value & Risk",
    description: "EV, model vs market, Kelly stakes",
    icon: "value",
  },
  {
    href: "/goal-probability",
    label: "Goal Probability",
    description: "Team goal-range probabilities",
    icon: "goal",
  },
  {
    href: "/exact-score",
    label: "Exact Score",
    description: "Score predictions",
    icon: "score",
  },
  {
    href: "/match-analysis",
    label: "Match Analysis",
    description: "Full two-team analysis",
    icon: "match",
  },
  {
    href: "/history",
    label: "History",
    description: "Saved analyses",
    icon: "history",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Model and display settings",
    icon: "settings",
  },
];
