import { createContext, useContext, useState, useCallback } from "react";
import { Snackbar } from "react-native-paper";

interface SnackbarContextType {
  show: (message: string, action?: { label: string; onPress: () => void }) => void;
  hide: () => void;
}

const SnackbarContext = createContext<SnackbarContextType>({
  show: () => {},
  hide: () => {},
});

export function useSnackbar() {
  return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<{ label: string; onPress: () => void } | undefined>();

  const show = useCallback((msg: string, act?: { label: string; onPress: () => void }) => {
    setMessage(msg);
    setAction(act);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <SnackbarContext.Provider value={{ show, hide }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={hide}
        duration={3000}
        action={action}
        onIconPress={hide}
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
