import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

      const normalizedUsername = username.trim().toLowerCase();
      const demoTypedPassword = password.trim();
      const isDemoCredentials = normalizedUsername === "admin" && demoTypedPassword === "admin";

      // Backend requires password length >= 6 (User model minlength).
      // Your UI demo shows `admin` / `admin` (length 5), so we map to a compatible password
      // only for the demo flow, without changing the UI.
      const effectivePassword = isDemoCredentials ? "admin123" : password;

      // Your existing admin UI indicates demo credentials are `admin` / `admin`.
      // The backend login expects `email`, so map `admin` -> `admin@royaloven.com`.
      const demoAdminEmail = "admin@royaloven.com";
      const email = normalizedUsername === "admin" ? demoAdminEmail : username.trim();

      const loginWithEmail = async (loginEmail: string) => {
        const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: effectivePassword }),
        });

        const json: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
          throw new Error(msg || "Invalid credentials.");
        }

        const token: string | undefined = (json as { data?: { token?: string } })?.data?.token;
        if (!token) throw new Error("Token missing from login response.");
        return token;
      };

      const attemptDemoSeed = async () => {
        // If demo user doesn't exist yet, create an admin account so CRUD can work.
        const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Admin",
            email: demoAdminEmail,
            password: effectivePassword,
            role: "admin",
          }),
        });

        // Ignore "already exists"; we just need it to be present.
        if (!res.ok) {
          const json: unknown = await res.json().catch(() => ({}));
          const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
          // Only throw if it's not a normal conflict.
          if (!msg.toLowerCase().includes("email already exists")) {
            throw new Error(msg || "Failed to create demo admin.");
          }
        }
      };

      // Try normal login first.
      let token: string | undefined;
      try {
        token = await loginWithEmail(email);
      } catch (loginErr) {
        // If user typed demo credentials, seed the admin user then retry.
        if (isDemoCredentials) {
          await attemptDemoSeed();
          token = await loginWithEmail(demoAdminEmail);
        } else {
          throw loginErr;
        }
      }

      sessionStorage.setItem("admin_demo", "true");
      sessionStorage.setItem("admin_token", token);

      toast.success("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md bg-card rounded-2xl card-shadow p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Login</h1>
          <p className="text-muted-foreground text-sm mt-2">Enter your credentials to access the admin panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
            Sign In
          </button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Demo: username <strong>admin</strong> / password <strong>admin</strong>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
