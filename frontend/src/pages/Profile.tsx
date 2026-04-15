import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { SavedAddress, UserAddress, UserPublic } from "@/lib/authApi";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const emptyAddress = (): UserAddress => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  phone: "",
  phoneAlt: "",
});

function isAddrFilled(a: UserAddress): boolean {
  return Boolean(
    a.line1?.trim() &&
      a.city?.trim() &&
      a.state?.trim() &&
      a.pincode?.trim() &&
      a.phone?.trim(),
  );
}

const MONGO_ID_RE = /^[a-f0-9]{24}$/i;

type DraftAddr = SavedAddress & { _key: string };

function newDraftRow(): DraftAddr {
  return { _key: crypto.randomUUID(), id: "", label: "Home", ...emptyAddress() };
}

function userToDraft(user: UserPublic): { rows: DraftAddr[]; defaultIndex: number } {
  const saved = user.addresses ?? [];
  const list = saved.length
    ? saved
    : isAddrFilled(user.address)
      ? [{ id: "", label: "Home", ...user.address }]
      : [];

  if (list.length === 0) {
    return { rows: [newDraftRow()], defaultIndex: 0 };
  }

  const rows: DraftAddr[] = list.map((a) => ({
    _key: (a.id && MONGO_ID_RE.test(a.id) ? a.id : null) || crypto.randomUUID(),
    id: a.id && MONGO_ID_RE.test(a.id) ? a.id : "",
    label: a.label?.trim() || "Home",
    line1: a.line1 || "",
    line2: a.line2 || "",
    city: a.city || "",
    state: a.state || "",
    pincode: a.pincode || "",
    country: a.country || "India",
    phone: a.phone || "",
    phoneAlt: a.phoneAlt || "",
  }));

  if (rows.length === 1 && !String(rows[0].phone || "").trim() && user.phone?.trim()) {
    rows[0] = { ...rows[0], phone: user.phone.trim() };
  }

  let defaultIndex = 0;
  const def = user.defaultAddressId;
  if (def && MONGO_ID_RE.test(def)) {
    const i = rows.findIndex((r) => r.id === def);
    if (i >= 0) defaultIndex = i;
  }

  return { rows, defaultIndex };
}

function formatAddressLines(a: UserAddress): string {
  const parts = [
    a.line1,
    a.line2,
    [a.city, a.state, a.pincode].filter(Boolean).join(", "),
    a.country,
  ].filter((p) => String(p || "").trim());
  const base = parts.join(" · ") || "—";
  const p1 = String(a.phone || "").trim();
  const p2 = String(a.phoneAlt || "").trim();
  const bits = [p1 ? `Mob: ${p1}` : "", p2 ? `Alt: ${p2}` : ""].filter(Boolean);
  if (!bits.length) return base;
  if (base === "—") return bits.join(" · ");
  return `${base} · ${bits.join(" · ")}`;
}

const Profile = () => {
  const { user, isLoading, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rows, setRows] = useState<DraftAddr[]>([newDraftRow()]);
  const [defaultIndex, setDefaultIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [removeConfirmIndex, setRemoveConfirmIndex] = useState<number | null>(null);

  const applyUser = useCallback((u: UserPublic) => {
    setName(u.name);
    setPhone(u.phone || "");
    const { rows: r, defaultIndex: di } = userToDraft(u);
    setRows(r);
    setDefaultIndex(di);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!editing) applyUser(user);
  }, [user, editing, applyUser]);

  if (!isLoading && !user) {
    return <Navigate to="/auth" replace state={{ from: "/profile" }} />;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const startEdit = () => {
    applyUser(user);
    setEditing(true);
  };

  const cancelEdit = () => {
    applyUser(user);
    setEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    const incomplete = rows.some((r) => !isAddrFilled(r));
    if (incomplete) {
      toast.error("Fill every address (including mobile at that address), or remove empty rows.");
      return;
    }
    if (rows.length === 0) {
      toast.error("Add at least one delivery address.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        addresses: rows.map((r) => ({
          id: r.id && MONGO_ID_RE.test(r.id) ? r.id : "",
          label: r.label.trim() || "Home",
          line1: r.line1.trim(),
          line2: r.line2.trim(),
          city: r.city.trim(),
          state: r.state.trim(),
          pincode: r.pincode.trim(),
          country: r.country.trim() || "India",
          phone: r.phone.trim(),
          phoneAlt: r.phoneAlt.trim(),
        })),
        defaultAddressIndex: defaultIndex,
      });
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...newDraftRow(), label: `Address ${prev.length + 1}` }]);
  };

  const setRow = (index: number, patch: Partial<DraftAddr>) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const setAddrField = (index: number, key: keyof UserAddress, value: string) => {
    setRow(index, { [key]: value } as Partial<DraftAddr>);
  };

  const displayRows = (user.addresses ?? []).length
    ? (user.addresses ?? [])
    : isAddrFilled(user.address)
      ? [{ id: "", label: "Home", ...user.address }]
      : [];

  let viewDefaultIdx = 0;
  if (displayRows.length) {
    const def = user.defaultAddressId;
    if (def && MONGO_ID_RE.test(def)) {
      const i = displayRows.findIndex((a) => a.id === def);
      if (i >= 0) viewDefaultIdx = i;
    }
  }

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const activeAddress = displayRows.length > 0 ? displayRows[viewDefaultIdx] : null;

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-12rem)] bg-muted/30">
        <div className="container max-w-xl py-8 md:py-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-display font-bold">
                {firstName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">{user.name}</h1>
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {user.email}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!editing ? (
                <button
                  type="button"
                  onClick={startEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/15"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <User className="h-4 w-4 text-primary" />
                  Personal
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Full name</dt>
                    <dd className="font-medium text-foreground text-right">{user.name?.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd className="font-medium text-foreground text-right break-all">{user.email?.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium text-foreground text-right">{user.phone?.trim() || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Active address phone</dt>
                    <dd className="font-medium text-foreground text-right">
                      {activeAddress?.phone?.trim() || user.phone?.trim() || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  Delivery addresses
                </div>
                {displayRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No address saved. Tap Edit to add one.</p>
                ) : (
                  <ul className="space-y-3">
                    {displayRows.map((a, i) => (
                      <li
                        key={a.id || `${i}`}
                        className={`rounded-xl border p-4 ${
                          i === viewDefaultIdx ? "border-primary/50 bg-primary/[0.06]" : "border-border bg-muted/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground">{a.label || "Home"}</span>
                          {i === viewDefaultIdx ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Active for orders
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{formatAddressLines(a)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">Editing profile</span>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  Personal
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Mobile</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input value={user.email} disabled className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground" />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    Addresses
                  </div>
                  <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the radio for the address used when you place an order.
                </p>

                {rows.map((row, index) => (
                  <div
                    key={row._key}
                    className={`rounded-xl border p-4 space-y-3 ${
                      defaultIndex === index ? "border-primary/45 bg-primary/[0.04]" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                          type="radio"
                          name="defaultAddress"
                          checked={defaultIndex === index}
                          onChange={() => setDefaultIndex(index)}
                          className="h-4 w-4 accent-primary"
                        />
                        Default for delivery
                      </label>
                      {rows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setRemoveConfirmIndex(index)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Remove address"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    <input
                      value={row.label}
                      onChange={(e) => setRow(index, { label: e.target.value })}
                      placeholder="Label (e.g. Home, Office)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <input
                      value={row.line1}
                      onChange={(e) => setAddrField(index, "line1", e.target.value)}
                      placeholder="Address line 1"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <input
                      value={row.line2}
                      onChange={(e) => setAddrField(index, "line2", e.target.value)}
                      placeholder="Address line 2 (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={row.phone}
                        onChange={(e) => setAddrField(index, "phone", e.target.value)}
                        placeholder="Mobile at this address"
                        inputMode="tel"
                        maxLength={32}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                      <input
                        value={row.phoneAlt}
                        onChange={(e) => setAddrField(index, "phoneAlt", e.target.value)}
                        placeholder="Additional mobile (optional)"
                        inputMode="tel"
                        maxLength={32}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={row.city}
                        onChange={(e) => setAddrField(index, "city", e.target.value)}
                        placeholder="City"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                      <input
                        value={row.state}
                        onChange={(e) => setAddrField(index, "state", e.target.value)}
                        placeholder="State"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                      <input
                        value={row.pincode}
                        onChange={(e) => setAddrField(index, "pincode", e.target.value)}
                        placeholder="PIN"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                      <input
                        value={row.country}
                        onChange={(e) => setAddrField(index, "country", e.target.value)}
                        placeholder="Country"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl hover:opacity-95 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save changes
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out?"
        description="You will be signed out from your account."
        confirmLabel="Logout"
        onConfirm={() => {
          setLogoutOpen(false);
          logout();
          toast.success("Signed out.");
        }}
      />
      <ConfirmDialog
        open={removeConfirmIndex !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveConfirmIndex(null);
        }}
        title="Remove this address?"
        description="This delivery address will be removed from your profile."
        confirmLabel="Remove"
        onConfirm={() => {
          const index = removeConfirmIndex;
          setRemoveConfirmIndex(null);
          if (index === null) return;
          if (rows.length <= 1) {
            toast.error("Keep at least one address.");
            return;
          }
          setRows((prev) => prev.filter((_, i) => i !== index));
          setDefaultIndex((prev) => {
            if (prev === index) return Math.max(0, index - 1);
            if (prev > index) return prev - 1;
            return prev;
          });
        }}
      />
    </>
  );
};

export default Profile;
