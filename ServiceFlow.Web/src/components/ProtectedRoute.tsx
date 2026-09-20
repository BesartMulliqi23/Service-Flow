import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { FullPageLoader } from "./FullPageLoader";

export function ProtectedRoute() {
    const { user, isInitializing } = useAuth();
    const location = useLocation();

    if (isInitializing) {
        return <FullPageLoader />;
    }

    if (user === null) {
        return <Navigate
            to='/login'
            replace
            state={{ from: location.pathname}}
        />
    }

    return <Outlet />
}