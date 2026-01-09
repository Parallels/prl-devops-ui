
import React from 'react';
import { Outlet } from 'react-router-dom';

export const MainLayout: React.FC = () => {
    return (
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100">
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};
