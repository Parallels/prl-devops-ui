import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@prl/ui-kit';

/**
 * 403 Forbidden page - displayed when user tries to access a route without permission
 */
export const Forbidden: React.FC = () => {
    const navigate = useNavigate();

    return (
        <EmptyState
            icon="Lock"
            title="403 - Forbidden"
            subtitle="You don't have permission to access this page. Please contact your administrator if you believe this is an error."
            actionLabel="Go to Home"
            onAction={() => navigate('/')}
            tone="warning"
            fullWidth
            fullHeight
        />
    );
};
