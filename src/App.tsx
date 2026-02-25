import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { ConfigProvider } from "./contexts/ConfigContext";
import { SessionProvider } from "./contexts/SessionContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { EventsHubProvider } from "./contexts/EventsHubContext";
import { SystemStatsProvider } from "./contexts/SystemStatsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { IconProvider } from "@prl/ui-kit";
import { renderIcon } from '@prl/ui-kit';

function App() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <SessionProvider>
          <WebSocketProvider>
            <EventsHubProvider>
              <SystemStatsProvider>
                <IconProvider renderIcon={renderIcon}>
                  <AppRouter />
                </IconProvider>
              </SystemStatsProvider>
            </EventsHubProvider>
          </WebSocketProvider>
        </SessionProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}

export default App;
