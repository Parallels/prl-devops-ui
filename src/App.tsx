
import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { BottomSheetProvider } from "./contexts/BottomSheetContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { NotificationProvider } from "./contexts/NotificationContext";

function App() {
  return (
    <AppRouter />
  );
}

export default App;
