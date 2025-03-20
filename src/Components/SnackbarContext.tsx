import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// Define the context type
interface SnackbarContextType {
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

// Create context with an empty function to prevent undefined errors
const SnackbarContext = createContext<SnackbarContextType>({ showSnackbar: () => {} });

// Custom Hook to use Snackbar Context
export const useSnackbar = () => useContext(SnackbarContext);

// Provider Component
export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Function to show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Function to close snackbar
  const handleClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};