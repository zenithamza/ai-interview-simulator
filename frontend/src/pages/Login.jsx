import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "../lib/api.js";
import { useAuth } from "../lib/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [step, setStep] = useState("email"); // "email" | "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  function handleGoogleSuccess(credentialResponse) {
    setError(null);
    authApi
      .google(credentialResponse.credential)
      .then(({ token, user }) => {
        login(token, user);
        navigate(redirectTo, { replace: true });
      })
      .catch((err) => setError(err.message));
  }

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.requestOtp(email.trim());
      setNotice(`Code sent to ${email.trim()}`);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await authApi.verifyOtp(email.trim(), code.trim());
      login(token, user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-89px)] max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Sign in
      </p>
      <h1 className="mb-2 font-display text-4xl text-text-primary">Welcome back.</h1>
      <p className="mb-10 text-text-muted">
        Your interview history and reports are tied to your account.
      </p>

      <div className="mb-6 flex justify-center [&>div]:!w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google sign-in failed")}
          theme="filled_black"
          shape="pill"
          width="100%"
        />
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      {step === "email" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent px-6 py-3 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Sending code…" : "Email me a code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {notice && <p className="text-sm text-accent">{notice}</p>}
          <input
            type="text"
            inputMode="numeric"
            required
            autoFocus
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-center font-mono text-lg tracking-[0.3em] text-text-primary placeholder:tracking-normal placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent px-6 py-3 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setNotice(null);
            }}
            className="w-full text-center font-mono text-xs text-text-muted hover:text-accent"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && (
        <p className="mt-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
    </main>
  );
}
