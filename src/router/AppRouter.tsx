
import React from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { MainLayout } from '../layout/MainLayout';
import { Home } from '../pages/Home';
import { UxDemo } from '@prl/ui-kit';
import { Libraries } from '../pages/Libraries';
import { Vms } from '../pages/Vms/Vms';
import { StartupGuard } from '../components/StartupGuard';
import { Onboarding, OnboardingPrefill } from '../pages/Onboarding/Onboarding';
import { Hosts } from '@/pages/Hosts/Hosts';

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
                path: '/library',
                element: <Libraries />,
            },
            {
                path: '/vms',
                element: <Vms />,
            },
            {
                path: '/hosts',
                element: <Hosts />,
            },
        ],
    },
]);

export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
