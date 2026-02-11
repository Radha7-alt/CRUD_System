import Link from "next/link";
import { useRouter } from "next/router";

export default function Sidebar({ user }) {
    const router = useRouter();

    const isActive = (path) =>
        router.pathname === path || router.pathname.startsWith(path + "/")
            ? "bg-blue-700"
            : "hover:bg-slate-800";

    async function handleLogout() {
        try {
            await fetch("/api/auth/logout");
        } catch (err) {
            console.error("Logout error:", err);
        }
        router.push("/login");
    }

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
            <div className="p-6 text-2xl font-bold border-b border-slate-800">
                AIT Lab System
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <Link
                    href="/papers"
                    className={`block p-3 rounded-xl transition ${isActive("/papers")}`}
                >
                    📄 Papers
                </Link>

                {/* Visible to ALL users */}
                <Link
                    href="/paper-statuses"
                    className={`block p-3 rounded-xl transition ${isActive("/paper-statuses")}`}
                >
                    🧪 Paper Statuses
                </Link>

                <Link
                    href="/journals"
                    className={`block p-3 rounded-xl transition ${isActive("/journals")}`}
                >
                    📓 Journals
                </Link>

                {/* Admin-only */}
                {user?.role === "admin" && (
                    <Link
                        href="/admin/users"
                        className={`block p-3 rounded-xl transition ${isActive("/admin/users")}`}
                    >
                        👥 Manage Users
                    </Link>
                )}
                {user?.role === "admin" && (
                    <Link href="/admin/logs" className={`block p-3 rounded-xl transition ${isActive("/admin/logs")}`}>
                        🧾 Logs
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="mb-4 px-3 text-sm text-slate-400">
                    Logged in as:{" "}
                    <span className="text-white font-medium">
                        {user?.name || user?.email || "Loading…"}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}
