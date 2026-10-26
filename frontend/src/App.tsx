import { MotionConfig } from "motion/react";
import { BrowserRouter, Route, Routes } from "react-router";

import { AuthProvider } from "./auth/AuthProvider";
import { RequireAuth } from "./auth/RequireAuth";
import { AlertsPage } from "./pages/AlertsPage";
import { FavoritesPage } from "./pages/FavoritesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    // reducedMotion="user": honor the OS "reduce motion" accessibility setting.
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Layout route: no path of its own, guards every route nested inside. */}
            <Route element={<RequireAuth />}>
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </MotionConfig>
  );
}
