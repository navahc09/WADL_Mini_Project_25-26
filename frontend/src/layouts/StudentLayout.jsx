import {
  BriefcaseBusiness,
  FileArchive,
  LayoutDashboard,
  ScrollText,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import ShellHeader from "../components/ShellHeader";
import ShellSidebar from "../components/ShellSidebar";
import { useAuth } from "../hooks/useAuth";

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/student/profile", label: "Profile", icon: UserCircle2 },
    { to: "/student/jobs", label: "Job Board", icon: BriefcaseBusiness },
    { to: "/student/applications", label: "Applications", icon: ScrollText },
    { to: "/student/documents", label: "Document Vault", icon: FileArchive },
  ];

  return (
    <div className="editorial-shell h-screen overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1600px] gap-4 px-3 py-3 md:px-5">
        {/* Sidebar */}
        <ShellSidebar
          navigation={navigation}
          cta={
            <Button className="w-full" onClick={() => navigate("/student/jobs")} size="lg">
              Explore Matching Jobs
            </Button>
          }
          footerLabel="Student Support"
          footerDescription="Profile guidance, deadline alerts, and portal assistance."
          onLogout={() => {
            logout();
            navigate("/login");
          }}
        />

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Mobile nav strip */}
          <div className="overflow-x-auto rounded-2xl bg-surface-container-low p-2 lg:hidden">
            <div className="flex gap-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-surface-container-lowest text-primary"
                        : "text-on-surface-variant"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Compact topbar */}
          <ShellHeader
            user={user}
            actions={
              <Button variant="secondary" size="sm" onClick={() => navigate("/student/jobs")}>
                Browse Jobs
              </Button>
            }
          />

          {/* Scrollable page content with page transitions */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden rounded-[1.2rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="px-2 pb-4 pt-2"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
