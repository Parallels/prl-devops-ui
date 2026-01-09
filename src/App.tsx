
import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { BottomSheetProvider } from "./contexts/BottomSheetContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

function App() {
  return (
    <BottomSheetProvider>
      <WebSocketProvider url="ws://localhost:8080/ws">
        <AppRouter />
      </WebSocketProvider>
    </BottomSheetProvider>
  );
}

export default App;
