import { useEffect, useState } from "react";
import { useRouter } from "next/router";

const STATUSES = ["submitted", "under_review", "rejected", "accepted"];

function statusClasses(status) {
  if (status === "accepted") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "under_review") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

export default function AdminPapersPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [papers, setPapers] = useState([]);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) return router.push("/login");
    const data = await res.json();
    if (data.role !== "admin") return router.push("/dashboard");
    setMe(data);
  }

  async function loadPapers(deleted = includeDeleted) {
    setMsg("");
    const url = deleted ? "/api/papers?deleted=1" : "/api/papers";
    const res = await fetch(url);
    const data = await res.json();
    setPapers(data);
  }

  useEffect(() => {
    (async () => {
      await loadMe();
      await loadPapers(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(paperId, newStatus) {
    setMsg("");
    const res = await fetch(`/api/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_status: newStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Status update failed");
      return;
    }
    setMsg("Status updated.");
    await loadPapers(includeDeleted);
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  async function restorePaper(id) {
    if (!confirm("Restore this paper?")) return;

    const res = await fetch(`/api/papers/${id}/restore`, {
      method: "POST",
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Restore failed");
      return;
    }

    await loadPapers(includeDeleted);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin: Paper Statuses</h1>
              {me ? (
                <p className="mt-1 text-slate-600">
                  Logged in as{" "}
                  <span className="font-semibold text-slate-900">{me.email}</span>
                </p>
              ) : (
                <p className="mt-1 text-slate-600">Loading admin…</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/papers")}
                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 px-5 py-2.5 font-semibold shadow-sm transition"
              >
                Back to Papers
              </button>
              <button
                onClick={logout}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="inline-flex items-center gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-blue-600"
                checked={includeDeleted}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setIncludeDeleted(checked);
                  await loadPapers(checked);
                }}
              />
              Show deleted papers too
            </label>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                Total:{" "}
                <span className="font-semibold text-slate-900">{papers.length}</span>
              </span>
              {msg && (
                <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-sm text-blue-800">
                  {msg}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Owner</th>
                  <th className="px-5 py-3 font-semibold">Journal</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Deleted?</th>
                  <th className="px-5 py-3 font-semibold">Update</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {papers.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{p.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Authors: {(p.authors || []).join(", ") || "—"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-800">{p.createdBy?.email || "—"}</td>
                    <td className="px-5 py-4 text-slate-800">{p.journalId?.name || "—"}</td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${statusClasses(
                          p.current_status
                        )}`}
                      >
                        {p.current_status}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${
                          p.is_deleted ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.is_deleted ? "yes" : "no"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                          value={p.current_status}
                          onChange={(e) => updateStatus(p._id, e.target.value)}
                          disabled={p.is_deleted}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        {p.is_deleted && (
                          <button
                            onClick={() => restorePaper(p._id)}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold shadow-sm transition"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!papers.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-600">
                      No papers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-600">
            Note: Deleted papers can&apos;t be status-changed (dropdown disabled).
          </p>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
