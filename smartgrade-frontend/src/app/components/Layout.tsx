import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Menu, GraduationCap } from "lucide-react";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: "var(--color-section-bg)" }}>
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header — dark to match sidebar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
          style={{ background: "#0f0a2e", borderBottom: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Menu className="w-5 h-5 text-purple-300" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-white">SmartGrade</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto" style={{ background: "var(--color-section-bg)" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
