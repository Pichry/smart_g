import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./components/ThemeContext";
import { AuthProvider } from "./lib/AuthContext";
import { PlanProvider } from "./lib/PlanContext";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PlanProvider>
          <RouterProvider router={router} />
        </PlanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
