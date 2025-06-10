import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PrivateRouterContextProvider,
  PrivateRouteWrapper,
} from './context/PrivateRouterContext';
import { SnackbarProvider } from './components/SnackbarContext';
import { useDispatch } from 'react-redux';
import { setUserDetails } from './store/slices/userSlice';
import Layout from './pages/private/AppBar/Layout';
import { publicRoutes } from './routes/PublicRoutes';
import { privateRoutes } from './routes/PrivateRoutes';

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const userDetails = localStorage.getItem('userDetails');
    if (userDetails) {
      dispatch(setUserDetails(JSON.parse(userDetails)));
    }
  }, []);

  // Sample commit

  return (
    <SnackbarProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <PrivateRouterContextProvider>
            <Routes>
              {/* Public Routes */}
              {publicRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}

              {/* Private Routes */}
              <Route element={<PrivateRouteWrapper />}>
                <Route element={<Layout />}>
                  {privateRoutes.map(({ path, element }) => (
                    <Route key={path} path={path} element={element} />
                  ))}
                </Route>
              </Route>
            </Routes>
          </PrivateRouterContextProvider>
        </Router>
      </QueryClientProvider>
    </SnackbarProvider>
  );
};

export default App;
