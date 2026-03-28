import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { testimonials as initial } from "@/data/mockData";

const ManageTestimonials = () => {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({ name: "", text: "" });

  const handleAdd = () => {
    if (!form.name || !form.text) { toast.error("Fill all fields"); return; }
    setItems([...items, { id: Date.now().toString(), name: form.name, text: form.text, rating: 5, avatar: form.name.split(" ").map(w => w[0]).join("") }]);
    setForm({ name: "", text: "" });
    toast.success("Testimonial added");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-semibold text-foreground">Manage Testimonials</h2>
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-4">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Review text" rows={3} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-none" />
        <button onClick={handleAdd} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90">Add Testimonial</button>
      </div>
      <div className="bg-card rounded-2xl card-shadow divide-y divide-border">
        {items.map((t) => (
          <div key={t.id} className="flex items-start justify-between px-6 py-4 gap-4">
            <div className="flex gap-3 items-start">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">{t.avatar}</div>
              <div>
                <p className="font-medium text-foreground">{t.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{t.text}</p>
              </div>
            </div>
            <button onClick={() => { setItems(items.filter((x) => x.id !== t.id)); toast.success("Deleted"); }} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageTestimonials;
