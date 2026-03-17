import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { TableProvider } from "./context/TableContext";
import { ChatProvider } from "./context/ChatContext";
import { ToastProvider } from "./context/ToastContext";
import AppRouter from "./routes/AppRouter";
import ToastViewport from "./components/common/ToastViewport";
import { useToast } from "./hooks/useToast";

function AppShell() {
  const { toasts, dismissToast } = useToast();

  return (
    <>
      <AppRouter />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TableProvider>
          <CartProvider>
            <ToastProvider>
              <ChatProvider>
                <AppShell />
              </ChatProvider>
            </ToastProvider>
          </CartProvider>
        </TableProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
