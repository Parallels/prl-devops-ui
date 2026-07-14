import './App.scss';
import { AppRouter } from './router/AppRouter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider } from './contexts/ConfigContext';
import { BinaryServiceProvider } from './contexts/BinaryServiceContext';
import { SessionProvider } from './contexts/SessionContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { EventsHubProvider } from './contexts/EventsHubContext';
import { SystemStatsProvider } from './contexts/SystemStatsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LockedHostProvider } from './contexts/LockedHostContext';
import { IconProvider, BottomSheetProvider } from '@prl/ui-kit';
import { renderIcon } from '@prl/ui-kit';
import { isInsecureTrialMode } from './utils/cryptoMode';

const INSECURE = (() => { try { return isInsecureTrialMode(); } catch { return false; } })();

if (INSECURE) {
    console.warn('\u26A0\uFE0F INSECURE MODE: encryption disabled. Do not use for real secrets.');
}

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <ConfigProvider>
        <BinaryServiceProvider>
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
        </BinaryServiceProvider>
      </ConfigProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
