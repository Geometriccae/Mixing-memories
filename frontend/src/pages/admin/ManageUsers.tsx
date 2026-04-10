import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ApiUserRow = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | string;
  orders: number;
  createdAt?: string;
};

const ManageUsers = () => {
  const [users, setUsers] = useState<ApiUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const adminTokenRef = useRef<string | null>(sessionStorage.getItem("admin_token"));

  const requireAdminToken = () => {
    const token = adminTokenRef.current ?? sessionStorage.getItem("admin_token");
    adminTokenRef.current = token;
    return token;
  };

  const roleLabel = useMemo(
    () => (r: string) => (String(r).toLowerCase() === "admin" ? "Admin" : "Customer"),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const token = requireAdminToken();
        if (!token) throw new Error("Admin token missing. Please login to the admin panel.");
        const res = await fetch(`${apiBaseUrl}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json: unknown = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
          throw new Error(msg || "Failed to load users.");
        }
        const data = json && typeof json === "object" && "data" in json ? (json as { data?: unknown }).data : [];
        const list = Array.isArray(data) ? (data as ApiUserRow[]) : [];
        if (!cancelled) setUsers(list);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (!cancelled) {
          setUsers([]);
          toast.error(msg || "Failed to load users.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Manage Users</h2>
      <div className="bg-card rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 font-semibold text-foreground">Name</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Role</th>
                <th className="text-left px-6 py-4 font-semibold text-foreground">Orders</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-sm text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="px-6 py-4 font-medium text-foreground">{u.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          String(u.role).toLowerCase() === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {roleLabel(String(u.role))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{Number(u.orders) || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
