import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, LockKeyhole, Loader2, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation({
    onSuccess: result => {
      if (result.success) setLocation("/admin");
      else setError("That email and password combination is not recognised.");
    },
    onError: () => setError("We couldn't sign you in just now. Please try again."),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) { setError("Enter your administrator email and password."); return; }
    setError("");
    login.mutate({ email: email.trim(), password });
  }

  return <main className="admin-auth-page">
    <div className="admin-auth-card">
      <div className="auth-topline"><Link href="/" className="back-link"><ArrowLeft size={17} /> Back to bakery</Link><ThemeToggle /></div>
      <div className="admin-auth-brand"><BrandMark linked={false} /></div>
      <div className="admin-auth-heading"><span className="eyebrow"><ShieldCheck size={14} /> Private area</span><h1>Administrator sign in</h1><p>Manage booking requests, customer details, order status and recent reviews.</p></div>
      <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
        <label className="field-label">Administrator email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" /></label>
        <label className="field-label">Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={login.isPending}>{login.isPending ? <Loader2 className="spin" size={18} /> : <LockKeyhole size={18} />} Secure sign in</button>
      </form>
    </div>
  </main>;
}
