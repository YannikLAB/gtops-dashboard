import { getDashboardData } from "@/lib/dashboard-data";

export const revalidate = 60;

function ProgressBar({ current, target }: { current: number; target: number }) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);

  return (
    <div className="mt-4">
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-500">{percentage}% of target</p>
    </div>
  );
}

export default async function Home() {
  const {
    boomMetrics,
    grantTargets,
    latestActivitySnapshot,
    learnerAlerts,
    syncStatus,
    dataSource,
  } = await getDashboardData();
  const capturedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(latestActivitySnapshot.capturedAt));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-emerald-950/30 lg:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                EC4A / GTOPs public dashboard
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
                Grant impact, learner progress, and workforce readiness in one place.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                A public-facing dashboard for compliance targets, Coursera
                activity, learner intervention signals, and future regional
                workforce data integrations.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-400 px-6 py-5 text-slate-950">
              <p className="text-sm font-bold uppercase tracking-widest">Status</p>
              <p className="mt-2 text-2xl font-black">MVP scaffold</p>
              <p className="mt-1 text-sm font-medium">
                {dataSource === "supabase" ? "Live Supabase metrics" : "Manual sample fallback active"}
              </p>
            </div>
          </div>
        </header>

        <section aria-labelledby="boom-numbers">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                Public impact metrics
              </p>
              <h2 id="boom-numbers" className="mt-2 text-3xl font-bold">
                Key metrics
              </h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {boomMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950"
              >
                <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{metric.helper}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
                  Coursera Activity
                </p>
                <h2 className="mt-2 text-3xl font-bold">Latest learner snapshot</h2>
              </div>
              <p className="rounded-full bg-white/10 px-4 py-2 text-sm text-slate-300">
                Source: {latestActivitySnapshot.source}
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Avg hours / learner</p>
                <p className="mt-2 text-3xl font-black">
                  {latestActivitySnapshot.avgHoursPerLearner}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Monthly learning hours</p>
                <p className="mt-2 text-3xl font-black">
                  {latestActivitySnapshot.avgMonthlyLearningHours}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-5">
                <p className="text-sm text-slate-400">Learners making progress</p>
                <p className="mt-2 text-3xl font-black">
                  {latestActivitySnapshot.learnersMakingProgress}
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm text-slate-400">Captured {capturedAt}</p>
          </article>

          <aside className="rounded-3xl border border-amber-300/30 bg-amber-300/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">
              Sync status
            </p>
            <h2 className="mt-2 text-2xl font-bold">{syncStatus.result}</h2>
            <dl className="mt-5 space-y-3 text-sm text-amber-50/90">
              <div>
                <dt className="font-semibold text-amber-100">Last sync time</dt>
                <dd>{syncStatus.lastSyncTime}</dd>
              </div>
              <div>
                <dt className="font-semibold text-amber-100">Sync source</dt>
                <dd>{syncStatus.source}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-amber-50/90">{syncStatus.message}</p>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white p-6 text-slate-950">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Compliance metrics
            </p>
            <h2 className="mt-2 text-3xl font-bold">Grant targets</h2>
            <div className="mt-6 space-y-6">
              {grantTargets.map((target) => (
                <div key={target.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <h3 className="font-bold">{target.label}</h3>
                      <p className="text-sm text-slate-500">Status: {target.status}</p>
                    </div>
                    <p className="text-lg font-black">
                      {target.current} / {target.target} {target.unit}
                    </p>
                  </div>
                  <ProgressBar current={target.current} target={target.target} />
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-300">
              Internal intervention metrics
            </p>
            <h2 className="mt-2 text-3xl font-bold">Learner alerts</h2>
            <div className="mt-6 space-y-4">
              {learnerAlerts.map((alert) => (
                <div
                  key={alert.label}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 p-5"
                >
                  <div>
                    <h3 className="font-bold">{alert.label}</h3>
                    <p className="mt-1 text-sm text-slate-400">{alert.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{alert.count}</p>
                    <p className="text-xs uppercase tracking-widest text-slate-500">
                      {alert.severity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

      </section>
    </main>
  );
}
