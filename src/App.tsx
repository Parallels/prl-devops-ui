import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { ConfigProvider } from "./contexts/ConfigContext";
import { SessionProvider } from "./contexts/SessionContext";
import { IconProvider } from "@prl/ui-kit";
import { renderIcon } from '@prl/ui-kit';

function App() {
  return (
    <ConfigProvider>
      <SessionProvider>
        <IconProvider renderIcon={renderIcon}>
          <AppRouter />
        </IconProvider>
      </SessionProvider>
    </ConfigProvider>
  );
}

export default App;
