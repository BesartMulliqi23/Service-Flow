import { Navigate, Route, Routes } from "react-router"
import { WelcomePage } from "./pages/WelcomePage"
import { LoginPage } from "./pages/LoginPage"
import { NotFoundPage } from "./pages/NotFoundPage"

function App() {
  return (
    <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
