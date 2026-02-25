import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

interface ProtectedRouteProps {
    /** Children to render if permission check passes */
    children: React.ReactNode;

    /** Required claims - user must have ALL of these claims */
    requiredClaims?: string[];

    /** Required claims (any) - user must have AT LEAST ONE of these claims */
    requiredAnyClaim?: string[];

    /** Required roles - user must have ALL of these roles */
    requiredRoles?: string[];
}

/**
 * ProtectedRoute component that wraps routes requiring specific claims or roles.
 * Redirects to /forbidden if the user doesn't have the required permissions.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredClaims = [],
    requiredAnyClaim = [],
    requiredRoles = [],
}) => {
    const { hasAllClaims, hasAnyClaim, hasRole, session } = useSession();

    useEffect(() => {
        if (requiredClaims.length > 0) {
            console.log('[ProtectedRoute] Checking all claims:', requiredClaims);
        }
        if (requiredAnyClaim.length > 0) {
            console.log('[ProtectedRoute] Checking any claim:', requiredAnyClaim);
        }
        if (requiredRoles.length > 0) {
            console.log('[ProtectedRoute] Checking roles:', requiredRoles);
        }
    }, [requiredClaims, requiredAnyClaim, requiredRoles]);

    let hasPermission = true;

    if (requiredClaims.length > 0) {
        hasPermission = hasPermission && hasAllClaims(requiredClaims);
    }

    if (requiredAnyClaim.length > 0) {
        hasPermission = hasPermission && hasAnyClaim(requiredAnyClaim);
    }

    if (requiredRoles.length > 0) {
        hasPermission = hasPermission && requiredRoles.every((r) => hasRole(r));
    }

    if (!hasPermission) {
        console.warn('[ProtectedRoute] Access denied. User claims:', session?.tokenPayload?.claims ?? []);
        return <Navigate to="/forbidden" replace />;
    }

    return <>{children}</>;
};
