import { Navigate, Route, Routes } from "react-router"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { AppLayout } from "./layouts/AppLayout"
import { DashboardPage } from "./pages/DashboardPage"

function App() {
  return (
    <Routes>
        <Route path="/" element={<Navigate to='/app' replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
            </Route>
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
