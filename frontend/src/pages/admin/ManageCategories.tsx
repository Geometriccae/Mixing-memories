import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const initialCats = [
  { id: "1", name: "Vegetables", items: 48 },
  { id: "2", name: "Fruits", items: 36 },
  { id: "3", name: "Bakery", items: 24 },
  { id: "4", name: "Dairy & Eggs", items: 32 },
];

const ManageCategories = () => {
  const [cats, setCats] = useState(initialCats);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Enter name"); return; }
    if (editId) {
      setCats(cats.map((c) => c.id === editId ? { ...c, name } : c));
      toast.success("Updated");
    } else {
      setCats([...cats, { id: Date.now().toString(), name, items: 0 }]);
      toast.success("Added");
    }
    setName("");
    setEditId(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Manage Categories</h2>
      <div className="bg-card rounded-2xl p-6 card-shadow flex flex-col sm:flex-row gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        <button onClick={handleSave} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 w-full sm:w-auto">
          {editId ? "Update" : "Add"}
        </button>
      </div>
      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {cats.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.items} items</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => { setEditId(c.id); setName(c.name); }} className="p-2 hover:bg-accent rounded-lg text-muted-foreground"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => { setCats(cats.filter((x) => x.id !== c.id)); toast.success("Deleted"); }} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageCategories;
