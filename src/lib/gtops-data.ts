export type MetricStatus = "on-track" | "watch" | "behind" | "complete";

export type BoomMetric = {
  label: string;
  value: string;
  helper: string;
};

export type TargetMetric = {
  label: string;
  current: number;
  target: number;
  unit: string;
  status: MetricStatus;
};

export type AlertMetric = {
  label: string;
  count: number;
  description: string;
  severity: "low" | "medium" | "high";
};

export type ActivitySnapshot = {
  capturedAt: string;
  avgHoursPerLearner: number;
  avgMonthlyLearningHours: number;
  learnersMakingProgress: number;
  source: "manual" | "coursera-api" | "derived";
};

export const boomMetrics: BoomMetric[] = [
  {
    label: "Learners activated",
    value: "128",
    helper: "Participants enrolled or onboarded into GTOPs-supported learning",
  },
  {
    label: "AI literacy completions",
    value: "74",
    helper: "Learners completing foundational AI literacy milestones",
  },
  {
    label: "Certification completions",
    value: "18",
    helper: "Industry-recognized credentials completed to date",
  },
  {
    label: "Instructional hours",
    value: "1,940",
    helper: "Combined online and supported learning hours",
  },
];

export const grantTargets: TargetMetric[] = [
  {
    label: "AI-literate enrollees",
    current: 128,
    target: 250,
    unit: "learners",
    status: "watch",
  },
  {
    label: "Certifications",
    current: 18,
    target: 40,
    unit: "completions",
    status: "on-track",
  },
  {
    label: "Placements",
    current: 6,
    target: 20,
    unit: "placements",
    status: "watch",
  },
];

export const learnerAlerts: AlertMetric[] = [
  {
    label: "Inactive learners",
    count: 19,
    description: "No learning activity in the last 14 days",
    severity: "medium",
  },
  {
    label: "Stalled learners",
    count: 11,
    description: "Started but no measurable module progress recently",
    severity: "medium",
  },
  {
    label: "Needs mentor outreach",
    count: 7,
    description: "High-priority learners for staff follow-up",
    severity: "high",
  },
];

export const latestActivitySnapshot: ActivitySnapshot = {
  capturedAt: "2026-06-16T09:00:00-05:00",
  avgHoursPerLearner: 15.2,
  avgMonthlyLearningHours: 386,
  learnersMakingProgress: 87,
  source: "manual",
};

export const syncStatus = {
  source: "manual fallback",
  result: "Not connected",
  lastSyncTime: "No Coursera API sync has run yet",
  message:
    "Coursera sync requires OAuth credentials plus the Coursera organization/business ID from admin API requests or Coursera support. The web slug, such as hc4a, is not sufficient.",
};
