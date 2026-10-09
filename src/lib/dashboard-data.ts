import {
  boomMetrics as fallbackBoomMetrics,
  grantTargets as fallbackGrantTargets,
  latestActivitySnapshot as fallbackActivitySnapshot,
  learnerAlerts as fallbackLearnerAlerts,
  syncStatus as fallbackSyncStatus,
  type AlertMetric,
  type BoomMetric,
  type TargetMetric,
} from "@/lib/gtops-data";
import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export type DashboardData = {
  boomMetrics: BoomMetric[];
  grantTargets: TargetMetric[];
  learnerAlerts: AlertMetric[];
  latestActivitySnapshot: typeof fallbackActivitySnapshot;
  syncStatus: typeof fallbackSyncStatus;
  dataSource: "sample" | "supabase";
};

type PublicDashboardMetrics = {
  learners_activated: number | null;
  completions: number | null;
  progress_events: number | null;
  completion_events: number | null;
  learners_active_14d: number | null;
  last_xapi_received_at: string | null;
};

type ImpactMetricRow = {
  metric_key: string;
  metric_value: number;
  captured_at: string;
};

type LearnerActivitySnapshotRow = {
  captured_at: string;
  avg_hours_per_learner: number | null;
  avg_monthly_learning_hours: number | null;
  learners_making_progress: number | null;
  source: "manual" | "coursera-api" | "derived";
};

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(value ?? 0);
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!hasSupabaseServerConfig()) {
    return {
      boomMetrics: fallbackBoomMetrics,
      grantTargets: fallbackGrantTargets,
      learnerAlerts: fallbackLearnerAlerts,
      latestActivitySnapshot: fallbackActivitySnapshot,
      syncStatus: fallbackSyncStatus,
      dataSource: "sample",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const [xapiMetricsResult, impactMetricsResult, activitySnapshotResult] =
      await Promise.all([
        supabase
          .from("public_dashboard_metrics")
          .select("*")
          .single<PublicDashboardMetrics>(),
        supabase
          .from("impact_metrics")
          .select("metric_key, metric_value, captured_at")
          .order("captured_at", { ascending: false })
          .returns<ImpactMetricRow[]>(),
        supabase
          .from("learner_activity_snapshots")
          .select(
            "captured_at, avg_hours_per_learner, avg_monthly_learning_hours, learners_making_progress, source",
          )
          .order("captured_at", { ascending: false })
          .limit(1)
          .maybeSingle<LearnerActivitySnapshotRow>(),
      ]);

    if (xapiMetricsResult.error) throw xapiMetricsResult.error;
    if (impactMetricsResult.error) throw impactMetricsResult.error;
    if (activitySnapshotResult.error) throw activitySnapshotResult.error;

    const data = xapiMetricsResult.data;
    const latestImpactMetrics = new Map<string, number>();
    for (const metric of impactMetricsResult.data ?? []) {
      if (!latestImpactMetrics.has(metric.metric_key)) {
        latestImpactMetrics.set(metric.metric_key, metric.metric_value);
      }
    }
    const snapshot = activitySnapshotResult.data;

    const learnersActivated =
      latestImpactMetrics.get("learners_activated") ?? data.learners_activated ?? 0;
    const completions =
      latestImpactMetrics.get("course_completions") ?? data.completions ?? 0;
    const progressEvents =
      latestImpactMetrics.get("learners_making_progress") ?? data.progress_events ?? 0;
    const totalLearningHours = latestImpactMetrics.get("total_learning_hours") ?? 0;
    const active14d = data.learners_active_14d ?? 0;
    const learnersMakingProgress =
      snapshot?.learners_making_progress ??
      latestImpactMetrics.get("learners_making_progress") ??
      active14d;
    const inactiveLearners = Math.max(learnersActivated - active14d, 0);

    return {
      dataSource: "supabase",
      boomMetrics: [
        {
          label: "Learners activated",
          value: formatNumber(learnersActivated),
          helper: "Distinct learner emails received through Coursera xAPI",
        },
        {
          label: "Course completions",
          value: formatNumber(completions),
          helper: "Historical Coursera completions plus live xAPI completions",
        },
        {
          label: "Instructional hours",
          value: formatNumber(totalLearningHours),
          helper: "Historical Coursera learning-hours export",
        },
        {
          label: "Learners making progress",
          value: formatNumber(progressEvents),
          helper: "Historical Coursera progression export plus live xAPI activity",
        },
      ],
      grantTargets: [
        {
          label: "AI-literate enrollees",
          current: learnersActivated,
          target: 250,
          unit: "learners",
          status: learnersActivated >= 250 ? "complete" : "watch",
        },
        {
          label: "Certifications",
          current: completions,
          target: 40,
          unit: "completions",
          status: completions >= 40 ? "complete" : "on-track",
        },
        fallbackGrantTargets[2],
      ],
      learnerAlerts: [
        {
          label: "Inactive learners",
          count: inactiveLearners,
          description: "Activated learners without xAPI activity in the last 14 days",
          severity: inactiveLearners > 25 ? "high" : "medium",
        },
        {
          label: "Recently active learners",
          count: active14d,
          description: "Distinct learners with activity in the last 14 days",
          severity: "low",
        },
        fallbackLearnerAlerts[2],
      ],
      latestActivitySnapshot: {
        ...fallbackActivitySnapshot,
        capturedAt:
          snapshot?.captured_at ?? data.last_xapi_received_at ?? fallbackActivitySnapshot.capturedAt,
        avgHoursPerLearner:
          snapshot?.avg_hours_per_learner ?? fallbackActivitySnapshot.avgHoursPerLearner,
        avgMonthlyLearningHours:
          snapshot?.avg_monthly_learning_hours ??
          fallbackActivitySnapshot.avgMonthlyLearningHours,
        learnersMakingProgress,
        source: snapshot?.source ?? "coursera-api",
      },
      syncStatus: {
        source: snapshot ? "Coursera dashboard CSV + live xAPI" : "Coursera xAPI → Supabase",
        result: snapshot || data.last_xapi_received_at ? "Connected" : "Waiting for first xAPI event",
        lastSyncTime:
          snapshot?.captured_at ?? data.last_xapi_received_at ?? "No xAPI statements stored yet",
        message: snapshot
          ? "Historical Coursera dashboard exports are stored in Supabase. New xAPI statements will be added as Coursera sends them."
          : data.last_xapi_received_at
            ? "Coursera xAPI statements are being stored in Supabase and used for dashboard metrics."
            : "Supabase is connected, but no Coursera xAPI statements have been received yet.",
      },
    };
  } catch (error) {
    console.error("Dashboard Supabase read failed", error);
    return {
      boomMetrics: fallbackBoomMetrics,
      grantTargets: fallbackGrantTargets,
      learnerAlerts: fallbackLearnerAlerts,
      latestActivitySnapshot: fallbackActivitySnapshot,
      syncStatus: {
        ...fallbackSyncStatus,
        result: "Supabase read failed",
        message:
          error instanceof Error
            ? error.message
            : "Dashboard could not read Supabase metrics.",
      },
      dataSource: "sample",
    };
  }
}
