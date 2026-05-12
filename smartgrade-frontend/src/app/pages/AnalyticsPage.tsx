import { useEffect, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Card } from "../components/Card";
import { BarChart2, TrendingUp, Loader2, AlertCircle } from "lucide-react";
import { ApiError, analyticsApi, type Analytics } from "../lib/api";

export function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyticsApi.full()
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-slide-up">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
          Analytics
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Score distribution and trends across all your scans.
        </p>
      </div>

      {error && (
        <Card className="p-4 mb-4" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{error}</span>
          </div>
        </Card>
      )}

      {loading ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: "var(--color-primary)" }} />
        </Card>
      ) : !data || data.total_scans === 0 ? (
        <Card className="p-12 text-center">
          <BarChart2 className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <h3 className="font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
            Not enough data yet
          </h3>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Grade a few papers and your charts will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* Distribution */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
              <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Score distribution
              </h2>
              <span className="ml-auto text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {data.total_scans} graded {data.total_scans === 1 ? "paper" : "papers"}
              </span>
            </div>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={data.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    label={{ value: "Score range (%)", position: "insideBottom", offset: -5,
                             style: { fill: "var(--color-text-secondary)", fontSize: 12 } }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Trend */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: "#22C55E" }} />
              <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                30-day average score trend
              </h2>
            </div>
            {data.trend.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--color-text-secondary)" }}>
                No scans in the last 30 days.
              </p>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={data.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                      label={{ value: "Avg %", angle: -90, position: "insideLeft",
                               style: { fill: "var(--color-text-secondary)", fontSize: 12 } }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_pct"
                      stroke="#22C55E"
                      strokeWidth={2.5}
                      dot={{ fill: "#22C55E", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
