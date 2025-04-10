// src/App.tsx
import React, {useEffect} from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  PrivateRouterContextProvider,
  PrivateRouteWrapper,
} from './context/PrivateRouterContext';

import Login from './pages/public/Login';
import HomePage from './pages/private/HomePage';
import Layout from './pages/private/AppBar/Layout';
import Categories from './pages/private/Categories';
import Library from './pages/private/Library/Library';
import Users from './pages/private/Users';
import UserTemplates from './pages/private/UserTemplates';
import DraftTemplates from './pages/private/DraftTemplates';
import ComposeTemplates from './pages/private/ComposeTemplates';
import Subcategories from './pages/private/Subcategories';
import TemplateDetails from './pages/private/TemplateDetails';
import { SnackbarProvider } from './Components/SnackbarContext';
import ResetPassword from './pages/public/ResetPassword';
import { useDispatch } from 'react-redux';
import { setUserDetails } from 'src/store/slices/userSlice';

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const userDetails = localStorage.getItem('userDetails');
    if (userDetails) {
      dispatch(setUserDetails(JSON.parse(userDetails)));
    }
  }, []);

  return (
    <SnackbarProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <PrivateRouterContextProvider>
            <Routes>
              {/* Public Route */}
              <Route path="/" element={<Login />} />
              <Route path="/users/changeDefaultPassword" element={<ResetPassword />} />


              {/* Private Routes with Context-based protection */}
              <Route element={<PrivateRouteWrapper />}>
                <Route element={<Layout />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route
                    path="/home/categories/view-all"
                    element={<Categories />}
                  />
                  <Route path="/home/library" element={<Library />} />
                  <Route
                    path="/home/templates/view-all"
                    element={<ComposeTemplates />}
                  />
                  <Route
                    path="/home/templates/:id"
                    element={<TemplateDetails />}
                  />
                  <Route
                    path="/home/draft-templates"
                    element={<DraftTemplates />}
                  />
                  <Route
                    path="/home/user-templates/view-all"
                    element={<UserTemplates />}
                  />
                  <Route path="/home/users" element={<Users />} />
                  <Route
                    path="/home/categories/:categoryId"
                    element={<Subcategories />}
                  />
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
