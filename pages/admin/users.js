import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

export default function AdminUsersPage() {
  const router = useRouter();

  const [me, setMe] = useState(null);

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");

  // OPTIONAL: quick search when many users
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      // admin gate
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.role !== "admin") {
        router.push("/papers"); // ✅ changed from dashboard
        return;
      }
      setMe(data);

      await fetchUsers();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const n = (u.name || "").toLowerCase();
      const e = (u.email || "").toLowerCase();
      const r = (u.role || "").toLowerCase();
      return n.includes(q) || e.includes(q) || r.includes(q);
    });
  }, [users, search]);

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

  function startCreate() {
    resetForm();
    setIsCreating(true);
  }

  function startEdit(u) {
    setIsCreating(false);
    setSelectedUser(u);
    setName(u.name || "");
    setEmail(u.email || "");
    setRole(u.role || "user");
    setNewPassword("");
    setConfirmPassword("");
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      setMsg("❌ Name and email are required");
      return;
    }

    // Validate password only if one of them is filled
    const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0;
    if (wantsPasswordChange && newPassword !== confirmPassword) {
      setMsg("❌ Passwords do not match");
      return;
    }
    if (wantsPasswordChange && newPassword.length < 6) {
      setMsg("❌ Password must be at least 6 characters");
      return;
    }

    const url = isCreating ? "/api/admin/users" : `/api/admin/users/${selectedUser?._id}`;
    const method = isCreating ? "POST" : "PUT";

    // Only send password if admin provided it
    const body = {
      name: cleanName,
      email: cleanEmail,
      role,
      ...(wantsPasswordChange ? { password: newPassword } : {}),
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setMsg(isCreating ? "✅ User Created!" : "✅ User Updated!");
      await fetchUsers();

      if (isCreating) {
        resetForm();
      } else {
        // refresh selected user details from latest list
        const updated = (Array.isArray(users) ? users : []).find((u) => u._id === selectedUser?._id);
        if (updated) startEdit(updated);
      }
    } else {
      setMsg(data.message || "❌ Operation failed");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-300 p-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 px-8 py-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Lab User Management</h1>
            {me ? (
              <p className="mt-1 text-slate-600">
                Admin: <span className="font-semibold text-slate-900">{me.email}</span>
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
              onClick={startCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md"
            >
              + Create User
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 font-semibold shadow-md transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* List */}
          <div className="rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Team Members</h2>
              <span className="text-xs text-slate-500">
                Total: <span className="font-semibold">{users.length}</span>
              </span>
            </div>

            <input
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="mt-4 space-y-2 max-h-[60vh] overflow-auto pr-1">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => startEdit(u)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedUser?._id === u._id && !isCreating
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{u.name || "(no name)"}</p>
                  <p className="text-xs text-slate-600">{u.email}</p>
                  <p className="text-xs uppercase font-bold text-slate-500">{u.role}</p>
                </button>
              ))}

              {!filteredUsers.length && (
                <div className="text-sm text-slate-500 italic mt-6">No users match your search.</div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2 rounded-3xl bg-white/80 backdrop-blur-xl shadow-xl border border-white/40 p-7">
            {selectedUser || isCreating ? (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <h2 className="text-xl font-bold">
                  {isCreating ? "Create New User" : `Edit: ${name || selectedUser?.email || "User"}`}
                </h2>

                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      {isCreating ? "Password" : "New Password (optional)"}
                    </label>
                    <input
                      type="password"
                      placeholder={isCreating ? "Required" : "Leave blank to keep current"}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-300"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required={isCreating}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {isCreating ? "Confirm Password" : "Confirm New Password (optional)"}
                    </label>
                    <input
                      type="password"
                      placeholder={isCreating ? "Repeat password" : "Repeat new password"}
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
                    className="px-6 bg-slate-200 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>

                {msg && <p className="text-center font-bold text-blue-800">{msg}</p>}
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Select a user to edit or click Create User.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
