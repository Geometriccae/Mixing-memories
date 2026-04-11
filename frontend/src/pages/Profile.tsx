import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, LogOut, Save, UserCircle } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import type { UserAddress } from "@/lib/authApi";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const emptyAddress = (): UserAddress => ({
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
});

const Profile = () => {
  const { user, isLoading, updateProfile, logout } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<UserAddress>(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone || "");
    setAddress({ ...emptyAddress(), ...user.address });
  }, [user]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address,
      });
      toast.success("Profile saved.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const setAddr = (key: keyof UserAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-12rem)] bg-muted/40">
        <div className="container py-10 md:py-14 max-w-2xl">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">My profile</h1>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLogoutOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <section className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Personal</h2>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
                <input value={user.email} disabled className="w-full px-4 py-3 rounded-xl bg-muted/60 border border-border text-muted-foreground cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="Mobile number"
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 card-shadow space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Address</h2>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Address line 1</label>
                <input
                  value={address.line1}
                  onChange={(e) => setAddr("line1", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Address line 2</label>
                <input
                  value={address.line2}
                  onChange={(e) => setAddr("line2", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">City</label>
                  <input
                    value={address.city}
                    onChange={(e) => setAddr("city", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">State</label>
                  <input
                    value={address.state}
                    onChange={(e) => setAddr("state", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">PIN code</label>
                  <input
                    value={address.pincode}
                    onChange={(e) => setAddr("pincode", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Country</label>
                  <input
                    value={address.country}
                    onChange={(e) => setAddr("country", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[160px] bg-primary text-primary-foreground py-3.5 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save changes
            </button>
          </form>
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
    </>
  );
};

export default Profile;
