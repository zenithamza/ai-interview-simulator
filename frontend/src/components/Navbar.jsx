import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { useTheme } from "../lib/ThemeContext.jsx";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/login");
  }

  const initials = (user?.name || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="border-b border-border-subtle">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          <span className="font-display text-xl tracking-tight text-text-primary">
            Mockroom
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {user && (
            <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-text-muted">
              <Link
                to="/"
                className={`transition-colors hover:text-accent ${location.pathname === "/" ? "text-accent" : ""}`}
              >
                New session
              </Link>
              <Link
                to="/history"
                className={`transition-colors hover:text-accent ${location.pathname === "/history" ? "text-accent" : ""}`}
              >
                History
              </Link>
            </nav>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {theme === "dark" ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
                <path
                  d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface font-mono text-xs text-text-primary transition-colors hover:border-accent"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-11 w-52 rounded-xl border border-border-subtle bg-surface-raised p-2 shadow-xl">
                  <div className="px-3 py-2">
                    <div className="truncate font-display text-sm text-text-primary">{user.name || "Signed in"}</div>
                    <div className="truncate font-mono text-[11px] text-text-muted">{user.email}</div>
                  </div>
                  <div className="my-1 h-px bg-border-subtle" />
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-lg px-3 py-2 text-left font-mono text-xs text-danger transition-colors hover:bg-danger/10"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-accent px-4 py-1.5 font-mono text-xs font-medium text-accent-contrast transition-transform hover:scale-105"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
