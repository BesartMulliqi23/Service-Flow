import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { ApiError } from "../../api/apiClient";
import { getCurrentUser, loginUser, logoutUser, type CurrentUser, type LoginInput } from "./authApi";

type AuthContextValue = {
    user: CurrentUser | null,
    isInitializing: boolean,
    login: (input: LoginInput) => Promise<void>,
    logout: () => Promise<void>,
    refreshSession: () => Promise<CurrentUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const refreshSession = useCallback(async (): Promise<CurrentUser | null> => {
        setIsInitializing(true);

        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);

            return currentUser;
        } catch (error) {
            setUser(null);

            if (error instanceof ApiError && error.status === 401) {
                return null;
            }

            throw error;
        } finally {
            setIsInitializing(false);
        }
    }, []);

    useEffect(() => {
        void refreshSession().catch(error => console.error('Unable to restore the current session.', error));
    }, [refreshSession]);

    const login = useCallback(async (input: LoginInput) => {
        await loginUser(input);

        const currentUser = await getCurrentUser();
        setUser(currentUser);
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    }, []);

    const value = useMemo(() => ({
        user,
        isInitializing,
        login,
        logout,
        refreshSession
    }), [isInitializing, login, logout, user, refreshSession]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used inside AuthProvider.');
    }

    return context;
}