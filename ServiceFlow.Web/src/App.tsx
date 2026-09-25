import { Navigate, Route, Routes } from "react-router"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AppLayout } from "./layouts/AppLayout"
import { DashboardPage } from "./pages/DashboardPage"
import { RegisterPage } from "./pages/RegisterPage"
import { RegistrationPendingPage } from "./pages/RegistrationPendingPage"
import { ConfirmEmailPage } from "./pages/ConfirmEmailPage"
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage"
import { ResetPasswordPage } from "./pages/ResetPasswordPage"
import { ExternalLoginSuccessPage } from "./pages/ExternalLoginSuccessPage"
import { ExternalLoginErrorPage } from "./pages/ExternalLoginErrorPage"
import { ExternalOnboardingPage } from "./pages/ExternalOnboardingPage"
import { SchedulePage } from "./pages/SchedulePage"

function App() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to='/app' replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/registration-pending" element={<RegistrationPendingPage />} />
        <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/login/success" element={<ExternalLoginSuccessPage />} />
        <Route path="/login/error" element={<ExternalLoginErrorPage />} />
        <Route path="/onboarding/external" element={<ExternalOnboardingPage />} />

        <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="schedule" element={<SchedulePage />} />
            </Route>
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
