import { createSupabaseServerClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export type XapiStatementSummary = {
  id: string | null;
  timestamp: string | null;
  actorMbox: string | null;
  verbId: string | null;
  objectId: string | null;
  courseId: string | null;
  itemType: string | null;
  programId: string | null;
  scaledScore: number | null;
  success: boolean | null;
  completion: boolean | null;
};

function asRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeMbox(value: string | null) {
  if (!value) return null;
  return value.startsWith("mailto:") ? value.slice("mailto:".length) : value;
}

export function summarizeXapiStatement(statement: unknown): XapiStatementSummary {
  const record = asRecord(statement) ?? {};
  const actor = asRecord(record.actor);
  const verb = asRecord(record.verb);
  const object = asRecord(record.object);
  const result = asRecord(record.result);
  const score = asRecord(result?.score);
  const context = asRecord(record.context);

  return {
    id: asString(record.id),
    timestamp: asString(record.timestamp) ?? asString(record.stored),
    actorMbox: normalizeMbox(asString(actor?.mbox)),
    verbId: asString(verb?.id),
    objectId: asString(object?.id),
    courseId: asString(context?.["http://coursera.org/xapi/extensions/courseId"]),
    itemType: asString(context?.["http://coursera.org/xapi/extensions/itemType"]),
    programId: asString(context?.["http://coursera.org/xapi/extensions/programId"]),
    scaledScore: asNumber(score?.scaled),
    success: asBoolean(result?.success),
    completion: asBoolean(result?.completion),
  };
}

export async function persistXapiStatementsToSupabase(statementOrStatements: unknown) {
  if (!hasSupabaseServerConfig()) {
    return { stored: false, count: 0, reason: "Supabase is not configured." };
  }

  const statements = Array.isArray(statementOrStatements)
    ? statementOrStatements
    : [statementOrStatements];
  const rows = statements.map((statement) => {
    const summary = summarizeXapiStatement(statement);

    return {
      statement_id: summary.id,
      occurred_at: summary.timestamp,
      actor_mbox: summary.actorMbox,
      verb_id: summary.verbId,
      object_id: summary.objectId,
      course_id: summary.courseId,
      item_type: summary.itemType,
      program_id: summary.programId,
      scaled_score: summary.scaledScore,
      success: summary.success,
      completion: summary.completion,
      raw: statement,
    };
  });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("xapi_statements")
    .upsert(rows, { onConflict: "statement_id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Supabase xAPI insert failed: ${error.message}`);
  }

  return { stored: true, count: rows.length, reason: null };
}
