# Historical Coursera backfill

Coursera xAPI is a push integration for new activity. It usually does not backfill historical learner activity automatically.

To populate the dashboard with past activity, export historical learner/progress/completion data from Coursera admin and import it into Supabase.

## Recommended Coursera exports

Look in Coursera admin for reports/exports such as:

- learner progress
- enrollments
- completions
- course progress
- grades
- program analytics

The importer can handle flexible column names, but the best CSV columns are:

```csv
learner_email,occurred_at,event_type,course_id,course_name,program_id,item_type,scaled_score,success,completion
```

Template:

```text
data/templates/historical-coursera-template.csv
```

## Import a CSV

Save the Coursera export somewhere local, then run:

```bash
cd /Users/yannikbaurle/Documents/gtops-dashboard
node scripts/import-historical-coursera-csv.mjs /path/to/coursera-export.csv
```

The script reads Supabase credentials from `.env.local` and inserts rows into:

```text
xapi_statements
```

Then the public dashboard derives metrics from the same table that live xAPI uses.

## Supported column aliases

Learner email:

```text
learner_email, email, user_email, student_email
```

Timestamp:

```text
occurred_at, timestamp, completed_at, last_activity_at, date
```

Event type:

```text
event_type, verb, status, activity_type
```

Course:

```text
course_id, slug, course_slug, content_id
course_name, content_name, title
```

Progress/score:

```text
scaled_score, score, grade, progress_percent, progress
```

Completion:

```text
completion, completed, is_completed
```

## After import

Redeploy is not required after import. The dashboard revalidates about once per minute.

Open:

```text
https://gtops-dashboard.vercel.app/
```

and refresh after a minute.
