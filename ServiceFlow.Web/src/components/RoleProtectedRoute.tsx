import { Navigate, Outlet } from "react-router";
import { useAuth } from "../features/auth/AuthContext";
import { FullPageLoader } from "./FullPageLoader";

type RoleProtectedRouteProps = {
    allowedRoles: string[]
};

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
    const { user, isInitializing } = useAuth();

    if (isInitializing) {
        return <FullPageLoader />;
    }

    if (user === null) {
        return <Navigate to="/login" replace />;
    }

    const hasAllowedRole = user.roles.some(role => allowedRoles.includes(role));

    if (!hasAllowedRole) {
        return <Navigate to='/app' replace />;
    }

    return <Outlet />;
}