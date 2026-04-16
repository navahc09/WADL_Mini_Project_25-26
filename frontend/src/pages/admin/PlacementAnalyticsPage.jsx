import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminAnalytics } from "../../hooks/useAdmin";

const CHART_COLORS = ["#2563EB", "#16A34A", "#D97706", "#943700", "#E11D48"];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function PlacementAnalyticsPage() {
  const { data: analytics, isLoading, isError, error } = useAdminAnalytics();

  if (isLoading) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Loading analytics…</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Fetching placement signals.</p>
      </SurfaceCard>
    );
  }

  if (isError || !analytics) {
    return (
      <SurfaceCard className="p-5">
        <h2 className="font-headline text-xl font-bold">Analytics unavailable</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "Could not load placement analytics."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Placement Analytics</p>
        <h2 className="font-headline text-lg font-bold">Season signals & placement metrics</h2>
      </div>

      {/* KPI cards */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Total Students", value: analytics.total_students },
          { label: "Total Placed", value: analytics.total_placed },
          { label: "Placement Rate", value: `${analytics.placement_rate}%` },
          { label: "Average Salary", value: `${analytics.avg_salary_lpa} LPA` },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="panel-hover p-4">
              <p className="text-xs text-on-surface-variant">{item.label}</p>
              <p className="mt-1 font-headline text-2xl font-extrabold">{item.value}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Branch + Status charts */}
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Branch-wise placement</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">Placed vs not placed by department</p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.branch_stats}>
                <CartesianGrid stroke="#E6E8EA" vertical={false} />
                <XAxis dataKey="branch" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="placed" fill="#2563EB" radius={[6, 6, 0, 0]} />
                <Bar dataKey="not_placed" fill="#E0E3E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Application status mix</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">Current funnel distribution</p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.status_distribution}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {analytics.status_distribution.map((entry, index) => (
                    <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </div>

      {/* Trend + Salary charts */}
      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Monthly application trend</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">Application inflow vs offer momentum</p>
          <div className="mt-3 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthly_trend}>
                <CartesianGrid stroke="#E6E8EA" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="applications" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="offers" stroke="#943700" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-4">
          <h3 className="font-semibold text-on-surface">Salary distribution</h3>
          <p className="mt-0.5 text-xs text-on-surface-variant">Student outcomes by salary band</p>
          <div className="mt-3 space-y-2">
            {analytics.salary_bands.map((item, index) => (
              <div key={item.band} className="rounded-xl bg-surface-container-low p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-on-surface">{item.band}</p>
                  <p className="text-xs font-semibold text-on-surface">{item.count}</p>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-container-high">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.count / 650) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.08 }}
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
