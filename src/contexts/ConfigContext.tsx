import React, { createContext, useContext, useEffect, useState } from 'react';
import { IConfigService } from '../services/config/interfaces';
import { ConfigFactory } from '../services/config/ConfigFactory';
import { amplitudeService } from '../services/AmplitudeService';

const ConfigContext = createContext<IConfigService | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [configService, setConfigService] = useState<IConfigService | null>(null);
    const [initError, setInitError] = useState<Error | null>(null);

    useEffect(() => {
        const initService = async () => {
            try {
                const service = ConfigFactory.getConfigService();
                await service.initialize();
                await amplitudeService.initializeWithConfig(service);
                setConfigService(service);
            } catch (error: unknown) {
                console.error("Failed to initialize ConfigService:", error);
                setInitError(error instanceof Error ? error : new Error('Unknown initialization error'));
            }
        };
        initService();
    }, []);

    if (initError) {
        return (
            <div className="flex items-center justify-center h-screen p-6">
                <div className="max-w-lg text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Configuration Error</h1>
                    <p className="text-neutral-700 dark:text-neutral-300 mb-4">{initError.message}</p>
                    <pre className="text-xs bg-red-50 dark:bg-red-900/30 p-4 rounded overflow-auto text-left">
                        {initError.stack}
                    </pre>
                </div>
            </div>
        );
    }

    if (!configService) {
        // You might want a better loading state here
        return <div className="flex items-center justify-center h-screen">Loading configuration...</div>;
    }

    return (
        <ConfigContext.Provider value={configService}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
