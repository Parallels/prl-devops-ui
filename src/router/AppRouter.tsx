
import React from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { Home } from '../pages/Home';
import { UxDemo } from '@prl/ui-kit/pages/UxDemo/UxDemo';
import { Catalogs } from '../pages/Catalogs/Catalogs';
import { Vms } from '../pages/Vms/Vms';
import { StartupGuard } from '../components/StartupGuard';
import { Onboarding, OnboardingPrefill } from '../pages/Onboarding/Onboarding';
import { Hosts } from '@/pages/Hosts/Hosts';
import { NotFound } from '../pages/NotFound';
import { Forbidden } from '../pages/Forbidden';
import { Users } from '@/pages/Users/Users';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Claims as ClaimPerms, Roles as RolePerms } from '@/interfaces/tokenTypes';
import { Events } from '@/pages/Events/Events';
import { Logs } from '@/pages/Logs/Logs';
import { Roles } from '@/pages/Roles/Roles';
import { Claims } from '@/pages/Claims/Claims';
import { ApiKeys } from '@/pages/ApiKeys/ApiKeys';
import { Cache } from '@/pages/Cache/Cache';
import { ReverseProxy } from '@/pages/ReverseProxy/ReverseProxy';

const OnboardingRoute: React.FC = () => {
    const location = useLocation();
    const prefill = (location.state as { prefill?: OnboardingPrefill } | null)?.prefill;

    return <Onboarding prefill={prefill} />;
};

export const router = createBrowserRouter([
    {
        path: '/onboarding',
        element: <OnboardingRoute />,
    },
    {
        path: '/forbidden',
        element: <Forbidden />,
    },
    {
        path: '/',
        element: (
            <StartupGuard>
                <MainLayout />
            </StartupGuard>
        ),
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/ux-demo',
                element: <UxDemo />,
            },
            {
                path: '/catalogs',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_CATALOG_MANIFEST]}>
                        <Catalogs />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/vms',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_VM]}>
                        <Vms />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/hosts',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_REVERSE_PROXY_HOSTS]}>
                        <Hosts />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/users',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_USER]}>
                        <Users />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/roles',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_ROLE]}>
                        <Roles />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/claims',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_CLAIM]}>
                        <Claims />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/api-keys',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_API_KEY]}>
                        <ApiKeys />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/reverse-proxy',
                element: (
                    <ProtectedRoute requiredClaims={[ClaimPerms.LIST_REVERSE_PROXY_HOSTS]}>
                        <ReverseProxy />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/cache',
                element: <Cache />,
            },
            {
                path: '/events',
                element: (
                    <ProtectedRoute requiredRoles={[RolePerms.SUPER_USER]}>
                        <Events />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/logs',
                element: (
                    <ProtectedRoute requiredRoles={[RolePerms.SUPER_USER]}>
                        <Logs />
                    </ProtectedRoute>
                ),
            },
            {
                path: '*',
                element: <NotFound />,
            },
        ],
    },
    {
        path: '*',
        element: <NotFound />,
    },
]);


export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
