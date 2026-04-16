import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@/lib/inertia-shim';

export default function Welcome() {
  const { auth } = usePage<SharedData>().props;

  return (
    <>
      <Head title="SABC Eval360" />
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <span className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-600">
                NestJS + React
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 lg:text-6xl">
                  SABC Eval360 est maintenant porté par la stack active NestJS.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-stone-600 lg:text-lg">
                  Le socle applicatif actif repose sur le frontend React dans <code>apps/web</code>,
                  l’API NestJS dans <code>apps/api</code>, MySQL pour le core, PostgreSQL pour le
                  métier et Redis pour le cache partagé.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {auth?.user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center rounded-md bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                  >
                    Ouvrir le dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center rounded-md bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                    >
                      Se connecter
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center rounded-md border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-100"
                    >
                      Créer un compte
                    </Link>
                  </>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                Stack active
              </h2>
              <ul className="mt-5 space-y-4 text-sm text-stone-700">
                <li>
                  <span className="font-medium text-stone-950">Frontend</span>
                  <div>React SPA dans <code>apps/web</code></div>
                </li>
                <li>
                  <span className="font-medium text-stone-950">Backend</span>
                  <div>NestJS monolithique modulaire dans <code>apps/api</code></div>
                </li>
                <li>
                  <span className="font-medium text-stone-950">Data</span>
                  <div>MySQL core, PostgreSQL business, Redis cache</div>
                </li>
                <li>
                  <span className="font-medium text-stone-950">Opérations</span>
                  <div>Préflight, migrations SQL, healthchecks, charge ciblée</div>
                </li>
              </ul>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
