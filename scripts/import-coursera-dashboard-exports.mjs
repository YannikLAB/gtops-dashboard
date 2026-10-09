#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { existsSync, readFileSync } from "fs";
import path from "path";

function loadDotEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index);
      const value = trimmed.slice(index + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {}
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function csvRows(filePath) {
  return parse(readFileSync(filePath, "utf8"), {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
}

function numberFrom(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(String(value).replace(/[%,$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function readSingleNumber(filePath) {
  if (!existsSync(filePath)) return null;
  const rows = csvRows(filePath);
  return numberFrom(rows?.[1]?.[0]);
}

function readFirstMatchingNumber(filePath, headerName) {
  if (!existsSync(filePath)) return null;
  const rows = csvRows(filePath);
  const headers = rows[0] ?? [];
  const index = headers.findIndex((header) => String(header).trim() === headerName);
  if (index === -1) return null;
  for (const row of rows.slice(1)) {
    const value = numberFrom(row[index]);
    if (value !== null) return value;
  }
  return null;
}

async function main() {
  loadDotEnvLocal();
  const root = process.argv[2] ?? process.cwd();
  const completionsDir = path.join(root, "dashboard-learner_activity_-_completions_(eds)");
  const enrollmentsDir = path.join(root, "dashboard-learner_activity_-_enrollments_(eds)");
  const progressionDir = path.join(root, "dashboard-learner_activity_-_progression_(eds)");

  const totalCompletions = readSingleNumber(path.join(completionsDir, "completions_between_selected_date_range_mp.csv"));
  const newLearners = readFirstMatchingNumber(path.join(enrollmentsDir, "new_learner_enrollments_(mp).csv"), "Program New Learners");
  const totalEnrollments = readFirstMatchingNumber(path.join(enrollmentsDir, "new_learner_enrollments_(mp).csv"), "Total Enrollments");
  const avgHoursPerLearner = readSingleNumber(path.join(progressionDir, "average_hours_per_learner.csv"));
  const learnersMakingProgress = readSingleNumber(path.join(progressionDir, "learners_making_progress.csv"));
  const totalLearningHours = readSingleNumber(path.join(progressionDir, "total_hours.csv"));
  const avgMonthlyLearningHours = readFirstMatchingNumber(path.join(progressionDir, "average_monthly_learning_hours.csv"), "New Calculation");

  const capturedAt = new Date().toISOString();
  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const metrics = [
    ["learners_activated", "Learners activated", newLearners, "learners"],
    ["total_enrollments", "Total enrollments", totalEnrollments, "enrollments"],
    ["course_completions", "Course completions", totalCompletions, "completions"],
    ["total_learning_hours", "Instructional hours", totalLearningHours, "hours"],
    ["learners_making_progress", "Learners making progress", learnersMakingProgress, "learners"],
  ]
    .filter(([, , value]) => value !== null)
    .map(([metric_key, metric_label, metric_value, metric_unit]) => ({
      metric_key,
      metric_label,
      metric_value,
      metric_unit,
      source: "coursera-dashboard-csv",
      visible_publicly: true,
      captured_at: capturedAt,
    }));

  if (metrics.length) {
    const { error } = await supabase.from("impact_metrics").insert(metrics);
    if (error) throw error;
  }

  if (
    avgHoursPerLearner !== null ||
    avgMonthlyLearningHours !== null ||
    learnersMakingProgress !== null
  ) {
    const { error } = await supabase.from("learner_activity_snapshots").insert({
      captured_at: capturedAt,
      avg_hours_per_learner: avgHoursPerLearner,
      avg_monthly_learning_hours: avgMonthlyLearningHours,
      learners_making_progress: learnersMakingProgress,
      source: "derived",
      notes: "Imported from Coursera dashboard CSV exports.",
    });
    if (error) throw error;
  }

  console.log("Imported Coursera dashboard aggregate exports:");
  console.log({
    learners_activated: newLearners,
    total_enrollments: totalEnrollments,
    course_completions: totalCompletions,
    total_learning_hours: totalLearningHours,
    avg_hours_per_learner: avgHoursPerLearner,
    avg_monthly_learning_hours: avgMonthlyLearningHours,
    learners_making_progress: learnersMakingProgress,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
