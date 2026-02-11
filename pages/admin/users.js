import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return router.push("/login");
      const me = await res.json();
      if (me.role !== "admin") return router.push("/papers");
      await fetchUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } else if (res.status === 401) {
      router.push("/login");
    }
  }

  function resetForm() {
    setSelectedUser(null);
    setIsCreating(false);
    setName("");
    setEmail("");
    setRole("user");
    setNewPassword("");
    setConfirmPassword("");
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setMsg("❌ Passwords do not match");
        return;
      }
    }

    const url = isCreating ? "/api/admin/users" : `/api/admin/users/${selectedUser._id}`;
    const method = isCreating ? "POST" : "PUT";

    const payload = { name, email, role };
    if (newPassword) payload.password = newPassword;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(data.message || "❌ Operation failed");
      return;
    }

    setMsg(isCreating ? "✅ User Created!" : "✅ User Updated!");
    await fetchUsers();

    if (isCreating) resetForm();
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const n = String(u.name || "").toLowerCase();
      const e = String(u.email || "").toLowerCase();
      const r = String(u.role || "").toLowerCase();
      return n.includes(q) || e.includes(q) || r.includes(q);
    });
  }, [users, search]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-5xl">
        
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Lab User Management</h1>
            <p className="mt-1 text-slate-600 text-sm">Admins can create and update internal lab users.</p>
          </div>

          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
              setMsg("");
            }}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
          >
            + Create User
          </button>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* User list */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-slate-900">Team Members</h2>
              <span className="text-sm text-slate-600">
                Total: <span className="font-semibold text-slate-900">{filteredUsers.length}</span>
              </span>
            </div>

            <input
              className="w-full mb-4 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedUser(u);
                    setName(u.name || "");
                    setEmail(u.email || "");
                    setRole(u.role || "user");
                    setNewPassword("");
                    setConfirmPassword("");
                    setMsg("");
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedUser?._id === u._id
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-600">{u.email}</p>
                  <p className="text-xs uppercase font-bold text-slate-500">{u.role}</p>
                </button>
              ))}

              {!filteredUsers.length && (
                <div className="text-center text-slate-600 text-sm py-8">No users found.</div>
              )}
            </div>
          </div>

         
          <div className="md:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            {selectedUser || isCreating ? (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <h2 className="text-xl font-bold text-slate-900">
                  {isCreating ? "Create New User" : `Edit User`}
                </h2>

                <div>
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Role</label>
                  <select
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">New Password</label>
                    <input
                      type="password"
                      placeholder={isCreating ? "Required" : "Leave blank to keep"}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required={isCreating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Repeat password"
                      className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={isCreating}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold hover:bg-blue-700 transition"
                  >
                    {isCreating ? "Save New User" : "Update User"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 bg-slate-200 rounded-xl font-bold hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>

                {msg && (
                  <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                    {msg}
                  </div>
                )}
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Select a user to edit or click Create User.
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">Built with React, Next.js, MongoDB, and Tailwind CSS</p>
      </div>
    </main>
  );
}
