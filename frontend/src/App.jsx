import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from "./hooks/useAuth";

const StudentLayout = lazy(() => import("./layouts/StudentLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SetupPasswordPage = lazy(() => import("./pages/auth/SetupPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const Dashboard = lazy(() => import("./pages/student/Dashboard"));
const ProfilePage = lazy(() => import("./pages/student/ProfilePage"));
const JobBoardPage = lazy(() => import("./pages/student/JobBoardPage"));
const JobDetailPage = lazy(() => import("./pages/student/JobDetailPage"));
const MyApplicationsPage = lazy(() => import("./pages/student/MyApplicationsPage"));
const DocumentVaultPage = lazy(() => import("./pages/student/DocumentVaultPage"));
const NotificationsPage = lazy(() => import("./pages/student/NotificationsPage"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const PostJobPage = lazy(() => import("./pages/admin/PostJobPage"));
const ManageJobsPage = lazy(() => import("./pages/admin/ManageJobsPage"));
const ApplicantsPage = lazy(() => import("./pages/admin/ApplicantsPage"));
const EditJobPage = lazy(() => import("./pages/admin/EditJobPage"));
const PlacementAnalyticsPage = lazy(() => import("./pages/admin/PlacementAnalyticsPage"));
const ManageStudentsPage = lazy(() => import("./pages/admin/ManageStudentsPage"));

function RoleHomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/student" replace />;
}

function PrivateRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="editorial-shell flex min-h-screen items-center justify-center">
            <div className="rounded-[1.5rem] bg-surface-container-lowest px-6 py-5 text-sm font-semibold text-on-surface ambient-shadow">
              Loading TNP Connect...
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup-password" element={<SetupPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/student"
            element={
              <PrivateRoute role="student">
                <StudentLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="jobs" element={<JobBoardPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="documents" element={<DocumentVaultPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <PrivateRoute role="admin">
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<ManageStudentsPage />} />
            <Route path="jobs/new" element={<PostJobPage />} />
            <Route path="jobs" element={<ManageJobsPage />} />
            <Route path="jobs/:id/edit" element={<EditJobPage />} />
            <Route path="jobs/:id/applicants" element={<ApplicantsPage />} />
            <Route path="analytics" element={<PlacementAnalyticsPage />} />
          </Route>

          <Route path="/home" element={<RoleHomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
