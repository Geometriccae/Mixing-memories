import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/admin/orders": "Orders",
  "/admin/orders/placed": "Placed Orders",
  "/admin/orders/shipped": "Shipped Orders",
  "/admin/orders/completed": "Completed Orders",
  "/admin/orders/cancelled": "Cancelled Orders",
  "/admin/transactions": "Transactions",
  "/admin/transactions/success": "Success Transaction",
  "/admin/transactions/pending": "Pending Transaction",
  "/admin/master/manufacturer": "Manufacturer List",
  "/admin/master/quality": "Quality List",
};

const AdminStub = () => {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Admin";
  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
      {title} — this section will be available soon.
    </div>
  );
};

export default AdminStub;
