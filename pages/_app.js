import "../styles/globals.css";
import Sidebar from "../components/sidebar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  // Pages that should NOT have a sidebar
  const publicPages = ["/login", "/"];
  const showSidebar = !publicPages.includes(router.pathname);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadMe() {
      if (!showSidebar) {
        setCurrentUser(null);
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          if (!ignore) setCurrentUser(null);
          return;
        }
        const data = await res.json();
        if (!ignore) setCurrentUser(data);
      } catch {
        if (!ignore) setCurrentUser(null);
      }
    }

    loadMe();
    return () => {
      ignore = true;
    };
  }, [showSidebar, router.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {showSidebar && <Sidebar user={currentUser} />}

      <main className={`flex-1 ${showSidebar ? "ml-64" : ""}`}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
