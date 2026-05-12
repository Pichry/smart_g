import { useLocation, useNavigate } from "react-router";
import { LayoutDashboard, Scan, FileKey, BarChart3, History, CreditCard, Settings, LogOut, GraduationCap, X, Zap, Sparkles, Crown, FileEdit } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { usePlan } from "../lib/PlanContext";

const navigation = [
  { name: "Dashboard", path: "/app", icon: LayoutDashboard },
  { name: "Scan Paper", path: "/app/scan", icon: Scan },
  { name: "Generate Exam", path: "/app/generate-exam", icon: FileEdit },
  { name: "Answer Keys", path: "/app/answer-keys", icon: FileKey },
  { name: "Analytics", path: "/app/analytics", icon: BarChart3 },
  { name: "Results", path: "/app/results", icon: History },
  { name: "Subscription", path: "/app/subscription", icon: CreditCard },
  { name: "Settings", path: "/app/settings", icon: Settings },
];

interface SidebarProps { onClose?: () => void; }

export function Sidebar({ onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { plan } = usePlan();
  const handleNav = (path: string) => { navigate(path); onClose?.(); };
  const handleLogout = () => { logout(); navigate("/"); onClose?.(); };

  return (
    <div className="w-64 h-screen flex flex-col app-sidebar">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "rgba(124,58,237,0.2)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-tight">SmartGrade</h1>
              <p className="text-xs leading-tight text-purple-400">Paper Correction</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-purple-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(item.path);
          return (
            <button key={item.name} onClick={() => handleNav(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
              style={{ backgroundColor: isActive ? "#7c3aed" : "transparent", color: isActive ? "#fff" : "#c4b5fd" }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(124,58,237,0.2)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? "#fff" : "#7c6fa0" }} />
              <span className="font-medium text-sm">{item.name}</span>
              {item.name === "Scan Paper" && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "rgba(124,58,237,0.3)", color: isActive ? "#fff" : "#c4b5fd" }}>
                  New
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Usage */}
      <div className="px-3 pb-3">
        {user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 mb-2 rounded-xl"
            style={{ background: "rgba(124,58,237,0.10)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.35)", color: "#fff" }}>
              {user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-purple-300 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <div className="rounded-xl p-3 mb-2" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
          {plan?.plan === "free" ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-300 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Free Trial
                </span>
                <span className="text-xs font-bold text-purple-400">
                  {plan.free_scans_used}/{plan.free_scans_limit}
                </span>
              </div>
              <div className="w-full rounded-full h-1.5 mb-2" style={{ backgroundColor: "rgba(124,58,237,0.2)" }}>
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(plan.free_scans_used / plan.free_scans_limit) * 100}%` }}
                />
              </div>
              <button onClick={() => handleNav("/app/subscription")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                <Zap className="w-3 h-3" /> Upgrade plan
              </button>
            </>
          ) : plan?.plan === "smart" ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-purple-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Smart Grading
                </span>
                <span className="text-[10px] font-semibold text-emerald-300">ACTIVE</span>
              </div>
              <p className="text-[10px] text-purple-300 mb-2">Unlimited grading · 3 pages</p>
              <button onClick={() => handleNav("/app/subscription")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                <Crown className="w-3 h-3" /> Go Advanced
              </button>
            </>
          ) : plan?.plan === "advanced" ? (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-purple-300 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Advanced
                </span>
                <span className="text-[10px] font-semibold text-emerald-300">ACTIVE</span>
              </div>
              <p className="text-[10px] text-purple-300 mb-2">All features · 5 pages · priority</p>
              <button onClick={() => handleNav("/app/subscription")}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                Manage plan
              </button>
            </>
          ) : (
            <div className="text-xs text-purple-300 text-center py-1">Loading plan...</div>
          )}
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-purple-300"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}>
          <LogOut className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
