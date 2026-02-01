import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setMe(data);
    }
    load();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="mt-1 text-slate-600">
                Manage your profile and submissions.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/papers")}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
              >
                Go to Papers
              </button>
              <button
                onClick={logout}
                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            {!me ? (
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-56 rounded bg-slate-200" />
                <div className="h-4 w-72 rounded bg-slate-200" />
                <div className="h-4 w-64 rounded bg-slate-200" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-slate-900">
                  Your account
                </h2>

                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <span className="text-slate-600">Name</span>
                    <span className="font-semibold text-slate-900">{me.name}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <span className="text-slate-600">Email</span>
                    <span className="font-semibold text-slate-900">{me.email}</span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <span className="text-slate-600">Role</span>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-blue-800 font-semibold">
                      {me.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <span className="text-slate-600">ORCID</span>
                    <span className="font-semibold text-slate-900">
                      {me.orcid || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <span className="text-slate-600">Address</span>
                    <span className="font-semibold text-slate-900">
                      {me.address || "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push("/papers")}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
                  >
                    Manage Papers
                  </button>

                  {me.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin/papers")}
                      className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
                    >
                      Admin: Paper Statuses
                    </button>
                  )}

                  {me.role === "admin" && (
                    <button
                      onClick={() => router.push("/journals")}
                      className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
                    >
                      Admin: Journals
                    </button>
                  )}

                  {me.role === "admin" && (
                    <button
                      onClick={() => router.push("/admin/users")}
                      className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
                    >
                      Admin: Users
                    </button>
                  )}
                </div>
              </>
            )}

            {msg && (
              <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                {msg}
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            <h2 className="text-xl font-semibold text-slate-900">Tips</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                Use <span className="font-semibold">Papers</span> to add, edit, and soft-delete your submissions.
              </li>
              <li className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                Admins can update paper <span className="font-semibold">statuses</span> and manage journals.
              </li>
              <li className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                If you change role or password in Atlas, log out and log back in.
              </li>
            </ul>
          </aside>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
