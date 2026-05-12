import { useState } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Zap, Database, Bell, User, Shield, Sun, Moon } from "lucide-react";
import { useTheme } from "../components/ThemeContext";

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [aiReasoning, setAiReasoning] = useState(false);
  const [storeResults, setStoreResults] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  const usedScans = 8;
  const totalScans = 20;
  const pct = (usedScans / totalScans) * 100;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Manage your account and preferences</p>
      </div>

      <div className="space-y-5">
        {/* Appearance */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              {theme === "dark" ? <Moon className="w-4 h-4 text-purple-600" /> : <Sun className="w-4 h-4 text-purple-600" />}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Appearance</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Choose your preferred theme</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--hover-bg)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Sun className="w-4 h-4 text-amber-500" />
              <Toggle checked={theme === "dark"} onChange={() => toggle()} />
              <Moon className="w-4 h-4 text-purple-500" />
            </div>
          </div>
        </Card>

        {/* Usage */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg"><Zap className="w-4 h-4 text-purple-600" /></div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Usage</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Monitor your scan usage</p>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--hover-bg)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Free Scans Used</span>
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{usedScans} / {totalScans}</span>
            </div>
            <div className="w-full rounded-full h-2 overflow-hidden mb-2" style={{ backgroundColor: "var(--border-color)" }}>
              <div className={`h-full rounded-full ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-purple-600"}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              You have <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{totalScans - usedScans} scans remaining</span> in your free plan.
            </p>
            <Button variant="secondary" size="sm" className="mt-3">Upgrade to Unlimited</Button>
          </div>
        </Card>

        {/* Grading preferences */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg"><Database className="w-4 h-4 text-purple-600" /></div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Grading Preferences</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Configure how papers are graded</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Enable AI Reasoning", desc: "Use AI to provide detailed explanations for incorrect answers", value: aiReasoning, onChange: setAiReasoning, disabled: true, badge: "Pro Plan Required" },
              { label: "Store Scanned Results", desc: "Automatically save all scanned results to your history", value: storeResults, onChange: setStoreResults },
              { label: "Auto-Save Results", desc: "Automatically save results after each scan without confirmation", value: autoSave, onChange: setAutoSave },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--hover-bg)" }}>
                <div className="flex-1 mr-4">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  {item.badge && <span className="inline-block mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{item.badge}</span>}
                </div>
                <Toggle checked={item.value} onChange={item.onChange} disabled={item.disabled} />
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg"><Bell className="w-4 h-4 text-green-600" /></div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Notifications</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage your notification preferences</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: "var(--hover-bg)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Email Notifications</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Receive updates about your scans and account</p>
            </div>
            <Toggle checked={emailNotifications} onChange={setEmailNotifications} />
          </div>
        </Card>

        {/* Account */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "var(--hover-bg)" }}><User className="w-4 h-4" style={{ color: "var(--text-secondary)" }} /></div>
            <div>
              <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Account</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Manage your account settings</p>
            </div>
          </div>
          <div className="space-y-3">
            {[{ label: "Email", value: "teacher@example.com" }, { label: "Password", value: "••••••••" }].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{item.value}</p>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="p-6 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><Shield className="w-4 h-4 text-red-600" /></div>
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-400">Danger Zone</h3>
              <p className="text-xs text-red-600 dark:text-red-500">Irreversible actions</p>
            </div>
          </div>
          <div className="space-y-3">
            {[{ label: "Delete All Results", desc: "Permanently delete all scan history" }, { label: "Delete Account", desc: "Permanently delete your account and all data" }].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/30" style={{ backgroundColor: "var(--bg-card)" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{item.label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                </div>
                <Button variant="danger" size="sm">Delete</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
