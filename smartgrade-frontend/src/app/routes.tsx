import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ScanPage } from "./pages/ScanPage";
import { AnswerKeysPage } from "./pages/AnswerKeysPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ResultsPage } from "./pages/ResultsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { GenerateExamPage } from "./pages/GenerateExamPage";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/auth", Component: AuthPage },
  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: DashboardPage },
      { path: "scan", Component: ScanPage },
      { path: "answer-keys", Component: AnswerKeysPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "results", Component: ResultsPage },
      { path: "subscription", Component: SubscriptionPage },
      { path: "settings", Component: SettingsPage },
      { path: "generate-exam", Component: GenerateExamPage },
    ],
  },
]);
