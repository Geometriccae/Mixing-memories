import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Lock, Mail, User, UserPlus } from "lucide-react";
import royalOvenLogo from "@/assets/royal-oven-logo.png";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "signin" | "signup";

const Auth = () => {
  const { user, isLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
    const st = location.state as { mode?: string } | null;
    if (st?.mode === "signup") setMode("signup");
  }, [searchParams, location.state]);

  if (!isLoading && user) {
    const st = location.state as { from?: string } | null;
    const from = st?.from;
    const to =
      typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from : "/";
    return <Navigate to={to} replace />;
  }

  const redirectAfterAuth = () => {
    const st = location.state as { from?: string } | null;
    const from = st?.from;
    if (typeof from === "string" && from.startsWith("/") && !from.startsWith("//")) {
      navigate(from, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) {
          toast.error("Please enter your name.");
          setSubmitting(false);
          return;
        }
        await register(name.trim(), identifier.trim(), password);
        toast.success("Welcome to Royal Oven!");
      } else {
        await login(identifier.trim(), password);
        toast.success("Signed in successfully.");
      }
      redirectAfterAuth();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-4">
      <Link to="/" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to home
      </Link>
      <div className="w-full max-w-md bg-card rounded-2xl card-shadow p-8 border border-border/60">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img src={royalOvenLogo} alt="" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Royal Oven</h1>
          <p className="text-muted-foreground text-sm mt-2">Sign in or create an account</p>
        </div>

        <div className="flex rounded-xl bg-muted p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "signin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <User className="h-4 w-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Email or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
