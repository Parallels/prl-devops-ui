import React, { createContext, useContext, useEffect, useState } from 'react';
import { IConfigService } from '../services/config/interfaces';
import { ConfigFactory } from '../services/config/ConfigFactory';
import { amplitudeService } from '../services/AmplitudeService';

const ConfigContext = createContext<IConfigService | null>(null);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [configService, setConfigService] = useState<IConfigService | null>(null);

    useEffect(() => {
        const initService = async () => {
            try {
                const service = ConfigFactory.getConfigService();
                await service.initialize();
                await amplitudeService.initializeWithConfig(service);
                setConfigService(service);
            } catch (error) {
                console.error("Failed to initialize ConfigService:", error);
            }
        };
        initService();
    }, []);

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
