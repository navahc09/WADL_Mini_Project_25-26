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
import SectionHeading from "../../components/ui/SectionHeading";
import SurfaceCard from "../../components/ui/SurfaceCard";
import { useAdminAnalytics } from "../../hooks/useAdmin";

// Chart color palette — design system aligned
const CHART_COLORS = ["#2563EB", "#16A34A", "#D97706", "#943700", "#E11D48"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
};

const sectionFade = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function PlacementAnalyticsPage() {
  const { data: analytics, isLoading, isError, error } = useAdminAnalytics();

  if (isLoading) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Loading analytics</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          Fetching branch performance, salary bands, and application funnel trends.
        </p>
      </SurfaceCard>
    );
  }

  if (isError || !analytics) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="font-headline text-3xl font-bold">Analytics unavailable</h2>
        <p className="mt-3 text-sm text-on-surface-variant">
          {error?.response?.data?.error || "We could not load placement analytics right now."}
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        label="Placement Analytics"
        title="Read the season through placement signals"
        description="Compare branch performance, application status mix, and offer momentum using the admin-facing analytical layer."
      />

      {/* KPI cards */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="page-section grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {[
          { label: "Total Students", value: analytics.total_students },
          { label: "Total Placed", value: analytics.total_placed },
          { label: "Placement Rate", value: `${analytics.placement_rate}%` },
          { label: "Average Salary", value: `${analytics.avg_salary_lpa} LPA` },
        ].map((item) => (
          <motion.div key={item.label} variants={fadeUp}>
            <SurfaceCard className="panel-hover p-6 h-full">
              <p className="text-sm text-on-surface-variant">{item.label}</p>
              <p className="mt-3 font-headline text-4xl font-extrabold">{item.value}</p>
            </SurfaceCard>
          </motion.div>
        ))}
      </motion.section>

      {/* Branch + status charts */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Branch-wise placement</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Current placed vs not placed distribution across major departments.
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.branch_stats}>
                <CartesianGrid stroke="#E6E8EA" vertical={false} />
                <XAxis dataKey="branch" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="placed" fill="#2563EB" radius={[8, 8, 0, 0]} />
                <Bar dataKey="not_placed" fill="#E0E3E5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Application status mix</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            The current distribution of active applications across the funnel.
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.status_distribution}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={65}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {analytics.status_distribution.map((entry, index) => (
                    <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>
      </motion.div>

      {/* Trend + salary charts */}
      <motion.div
        variants={sectionFade}
        initial="hidden"
        animate="show"
        className="page-section grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Monthly application trend</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Compare application inflow with offer momentum through the current season.
          </p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthly_trend}>
                <CartesianGrid stroke="#E6E8EA" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="offers"
                  stroke="#943700"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-6">
          <h3 className="font-headline text-2xl font-bold">Salary distribution</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            A compact view of student outcomes by salary band.
          </p>
          <div className="mt-6 space-y-4">
            {analytics.salary_bands.map((item, index) => (
              <div key={item.band} className="rounded-[1.2rem] bg-surface-container-low p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-on-surface">{item.band}</p>
                  <p className="text-sm font-semibold text-on-surface">{item.count}</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((item.count / 650) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.1 }}
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </motion.div>
    </div>
  );
}
