import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function AdminLogsPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  async function loadMe() {
    const res = await fetch("/api/auth/me");
    if (res.status === 401) {
      router.push("/login");
      return null;
    }
    const data = await res.json();
    setMe(data);
    return data;
  }

  async function loadLogs(searchText = "") {
    setMsg("");
    const res = await fetch(`/api/logs?q=${encodeURIComponent(searchText)}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Failed to load logs");
      setLogs([]);
      return;
    }
    setLogs(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      const u = await loadMe();
      if (!u) return;

      // safety: client-side guard too
      if (u.role !== "admin") {
        router.push("/papers");
        return;
      }

      await loadLogs("");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return logs;
    return logs.filter((x) => {
      const s =
        `${x.action || ""} ${x.actorEmail || ""} ${x.entityType || ""} ${x.entityId || ""}`.toLowerCase();
      return s.includes(t);
    });
  }, [logs, q]);

  function pretty(obj) {
    try {
      if (obj == null) return "—";
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin: Logs</h1>
              <p className="mt-1 text-slate-600">
                {me ? `Logged in as ${me.email || me.name}` : "Loading…"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                className="w-80 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search logs (action, email, type)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                onClick={() => loadLogs(q)}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 font-semibold shadow-md transition"
              >
                Refresh
              </button>
            </div>
          </div>
        </header>

        {msg && (
          <div className="mt-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
            {msg}
          </div>
        )}

        <section className="mt-6 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent activity</h2>
            <div className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">{filtered.length}</span>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-700">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-5 py-3 font-semibold">Who</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Entity</th>
                  <th className="px-5 py-3 font-semibold">Before</th>
                  <th className="px-5 py-3 font-semibold">After</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filtered.map((x) => (
                  <tr key={x._id} className="align-top hover:bg-slate-50">
                    <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                      {x.createdAt ? new Date(x.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-800 whitespace-nowrap">
                      {x.actorEmail || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-900 whitespace-nowrap">
                      {x.action || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-800">
                      <div>{x.entityType || "—"}</div>
                      <div className="text-xs text-slate-500 break-all">{String(x.entityId || "")}</div>
                    </td>
                    <td className="px-5 py-4">
                      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-[320px] overflow-auto">
                        {pretty(x.before)}
                      </pre>
                    </td>
                    <td className="px-5 py-4">
                      <pre className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-[320px] overflow-auto">
                        {pretty(x.after)}
                      </pre>
                    </td>
                  </tr>
                ))}

                {!filtered.length && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-600">
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
