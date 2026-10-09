#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

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
  } catch {
    // .env.local is optional if env vars are already present.
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function first(row, names) {
  for (const name of names) {
    const normalized = normalizeHeader(name);
    if (row[normalized] !== undefined && row[normalized] !== "") return row[normalized];
  }
  return null;
}

function asBoolean(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1", "completed", "complete"].includes(normalized)) return true;
  if (["false", "no", "n", "0", "progressed", "in_progress", "in progress"].includes(normalized)) return false;
  return fallback;
}

function asNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function makeStatement(row) {
  const email = first(row, ["learner_email", "email", "user_email", "student_email"]);
  const occurredAt = toIsoDate(first(row, ["occurred_at", "timestamp", "completed_at", "last_activity_at", "date"]));
  const rawEventType = first(row, ["event_type", "verb", "status", "activity_type"]);
  const eventType = String(rawEventType ?? "progressed").toLowerCase().includes("complete")
    ? "completed"
    : "progressed";
  const completion = asBoolean(first(row, ["completion", "completed", "is_completed"]), eventType === "completed");
  const success = asBoolean(first(row, ["success", "passed"]), completion ? true : null);
  const courseId = first(row, ["course_id", "slug", "course_slug", "content_id"]);
  const courseName = first(row, ["course_name", "content_name", "title"]);
  const programId = first(row, ["program_id", "program", "cohort"]);
  const itemType = first(row, ["item_type", "content_type", "type"]) ?? "course";
  const scaledScore = asNumber(first(row, ["scaled_score", "score", "grade", "progress_percent", "progress"]));
  const normalizedScore = scaledScore && scaledScore > 1 ? scaledScore / 100 : scaledScore;

  const statementId = first(row, ["statement_id", "id"]) ?? `historical-${randomUUID()}`;
  const objectId = first(row, ["object_id", "url"])
    ?? (courseId ? `https://www.coursera.org/course/${courseId}` : `historical:${statementId}`);

  return {
    statement_id: statementId,
    occurred_at: occurredAt,
    actor_mbox: email?.replace(/^mailto:/, "") ?? null,
    verb_id: eventType === "completed"
      ? "http://adlnet.gov/expapi/verbs/completed"
      : "http://adlnet.gov/expapi/verbs/progressed",
    object_id: objectId,
    course_id: courseId,
    item_type: itemType,
    program_id: programId,
    scaled_score: normalizedScore,
    success,
    completion,
    raw: {
      importSource: "historical-coursera-csv",
      importedAt: new Date().toISOString(),
      courseName,
      original: row,
    },
  };
}

async function main() {
  loadDotEnvLocal();
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-historical-coursera-csv.mjs path/to/file.csv");
    process.exit(1);
  }

  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const content = readFileSync(csvPath, "utf8");
  const records = parse(content, {
    columns: (headers) => headers.map(normalizeHeader),
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });
  const rows = records.map(makeStatement);

  if (rows.length === 0) {
    console.log("No rows found.");
    return;
  }

  const batchSize = 500;
  let inserted = 0;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const { error } = await supabase
      .from("xapi_statements")
      .upsert(batch, { onConflict: "statement_id", ignoreDuplicates: true });

    if (error) throw error;
    inserted += batch.length;
  }

  console.log(`Imported ${inserted} historical Coursera rows into xapi_statements.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
