
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Home } from '../pages/Home';
import { UxDemo } from '../pages/UxDemo/UxDemo';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: <Home />,
            },
            {
                path: '/ux-demo',
                element: <UxDemo />,
            },
        ],
    },
]);

export const AppRouter: React.FC = () => {
    return <RouterProvider router={router} />;
};
