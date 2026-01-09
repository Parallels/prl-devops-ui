
import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { ConfigProvider } from "./contexts/ConfigContext";

function App() {
  return (
    <ConfigProvider>
      <AppRouter />
    </ConfigProvider>
  );
}

export default App;
