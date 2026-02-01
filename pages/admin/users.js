import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AdminUsersPage() {
  const router = useRouter();
  const [me, setMe] = useState(null);

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const [roleEmail, setRoleEmail] = useState("");
  const [roleMsg, setRoleMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return router.push("/login");
      const data = await res.json();
      if (data.role !== "admin") return router.push("/dashboard");
      setMe(data);
    })();
  }, [router]);

  async function resetPassword(e) {
    e.preventDefault();
    setMsg("");

    const res = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail, newPassword }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data.message || "Failed");
      return;
    }

    setMsg(`Password updated for ${data.email}`);
    setResetEmail("");
    setNewPassword("");
  }

  async function makeAdmin(e) {
    e.preventDefault();
    setRoleMsg("");

    const res = await fetch("/api/admin/users/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: roleEmail, role: "admin" }),
    });

    const data = await res.json();
    if (!res.ok) {
      setRoleMsg(data.message || "Failed");
      return;
    }

    setRoleMsg(`✅ ${data.email} is now ${data.role}`);
    setRoleEmail("");
  }

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
              <h1 className="text-3xl font-bold text-slate-900">Admin: Users</h1>
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

        <section className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            <h2 className="text-xl font-semibold text-slate-900">Reset user password</h2>
            <p className="mt-1 text-sm text-slate-600">
              Set a new password for an existing user (min 6 characters).
            </p>

            <form onSubmit={resetPassword} className="mt-5 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">User email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="user@txstate.edu"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">New password</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Minimum 6 characters"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold shadow-md transition"
              >
                Reset password
              </button>

              {msg && (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  {msg}
                </div>
              )}
            </form>
          </div>

          <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            <h2 className="text-xl font-semibold text-slate-900">Set user role</h2>
            <p className="mt-1 text-sm text-slate-600">
              Promote a user to admin using their email.
            </p>

            <form onSubmit={makeAdmin} className="mt-5 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">User email</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="user@txstate.edu"
                  value={roleEmail}
                  onChange={(e) => setRoleEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold shadow-md transition"
              >
                Make Admin
              </button>

              {roleMsg && (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  {roleMsg}
                </div>
              )}
            </form>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-600">
          Built with React, Next.js, MongoDB, and Tailwind CSS
        </p>
      </div>
    </main>
  );
}
