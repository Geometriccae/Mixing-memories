import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { label: string; orders: number };

type Props = {
  data: Row[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  className?: string;
};

const OrdersTrendBarChart = ({
  data,
  title = "Orders over time",
  subtitle = "Count per day or week in the selected range",
  emptyMessage = "No timeline data for this range.",
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
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} orders`, "Orders"]}
            />
            <Bar dataKey="orders" fill="hsl(168 55% 42%)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default OrdersTrendBarChart;
