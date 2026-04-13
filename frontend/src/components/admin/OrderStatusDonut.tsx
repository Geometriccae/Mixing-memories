import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { PieDatum } from "@/lib/adminOrderAnalytics";

type Props = {
  data: PieDatum[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  /** Card wrapper class when used inside a page that doesn't supply outer card */
  className?: string;
};

const OrderStatusDonut = ({
  data,
  title = "Order mix",
  subtitle = "By fulfilment status",
  emptyMessage = "No orders in this range.",
  className = "",
}: Props) => (
  <div className={className}>
    <h3 className="font-display text-base font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
    {data.length === 0 ? (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{emptyMessage}</div>
    ) : (
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} orders`, "Count"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default OrderStatusDonut;
