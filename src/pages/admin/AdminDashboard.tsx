import type { LucideIcon } from "lucide-react";
import { IndianRupee, ShoppingCart, User } from "lucide-react";

const cardBase =
  "bg-card rounded-[10px] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.06),0_2px_4px_-2px_rgba(0,0,0,0.06)] border border-border/40 p-5";

const iconWrap = "h-11 w-11 rounded-lg bg-[hsl(210_90%_94%)] flex items-center justify-center shrink-0";

const StatCard = ({
  title,
  value,
  icon: Icon,
  iconClassName = "h-5 w-5 text-[hsl(222_60%_28%)]",
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
}) => (
  <div className={cardBase}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground mb-2">{title}</p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight text-[hsl(222_60%_26%)]">{value}</p>
      </div>
      <div className={iconWrap}>
        <Icon className={iconClassName} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard title="Overall sales" value="₹ 225" icon={IndianRupee} />
      <StatCard title="Overall Order" value="4" icon={ShoppingCart} />
      <StatCard title="Total Customer" value="6" icon={User} />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Current Month Sales" value="₹" icon={IndianRupee} />
      <StatCard title="Current Month Order" value="0" icon={ShoppingCart} />
      <StatCard title="Previous Month Sales" value="₹" icon={IndianRupee} />
      <StatCard title="Previous Month Order" value="0" icon={ShoppingCart} />
    </div>
  </div>
);

export default AdminDashboard;
