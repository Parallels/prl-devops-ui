
import "./App.scss";
import { AppRouter } from "./router/AppRouter";
import { BottomSheetProvider } from "./contexts/BottomSheetContext";

function App() {
  return (
    <BottomSheetProvider>
      <AppRouter />
    </BottomSheetProvider>
  );
}

export default App;
