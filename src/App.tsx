import './App.scss';
import { AppRouter } from './router/AppRouter';
import { ConfigProvider } from './contexts/ConfigContext';
import { SessionProvider } from './contexts/SessionContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { EventsHubProvider } from './contexts/EventsHubContext';
import { SystemStatsProvider } from './contexts/SystemStatsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LockedHostProvider } from './contexts/LockedHostContext';
import { IconProvider, BottomSheetProvider } from '@prl/ui-kit';
import { renderIcon } from '@prl/ui-kit';

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <LockedHostProvider>
          <SessionProvider>
            <WebSocketProvider>
              <EventsHubProvider>
                <SystemStatsProvider>
                  <IconProvider renderIcon={renderIcon}>
                    <BottomSheetProvider>
                      <AppRouter />
                    </BottomSheetProvider>
                  </IconProvider>
                </SystemStatsProvider>
              </EventsHubProvider>
            </WebSocketProvider>
          </SessionProvider>
        </LockedHostProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
