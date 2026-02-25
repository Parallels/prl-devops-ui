import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@prl/ui-kit';

export const NotFound: React.FC = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="flex items-center justify-center h-full w-full p-6">
            <EmptyState
                icon="Error"
                iconSize="xl"
                fullWidth={true}
                title="404 - Page Not Found"
                subtitle="The page you're looking for doesn't exist or hasn't been implemented yet."
                actionLabel="Go to Home"
                onAction={handleGoHome}
                actionVariant="solid"
                actionColor="blue"
                tone="info"
            />
        </div>
    );
};
