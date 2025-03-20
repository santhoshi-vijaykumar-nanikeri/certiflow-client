import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/public/Login";
import HomePage from "./pages/private/HomePage";
import ProtectedRoute from "./pages/private/AppBar/ProtectedRoute";
import Layout from "./pages/private/AppBar/Layout"; // Common Layout with AppBar
import Categories from "./pages/private/Categories"; // Example private route
import Library from "./pages/private/Library/Library" // Example private route
import Users from "./pages/private/Users";
import UserTemplates from "./pages/private/UserTemplates";
import DraftTemplates from "./pages/private/DraftTemplates";
import ComposeTemplates from "./pages/private/ComposeTemplates";
import Subcategories from "./pages/private/Subcategories";
import SubcategoryTypePage from "./pages/private/Library/SubcategoryTypePage";
import { SnackbarProvider } from "./Components/SnackbarContext";
const queryClient = new QueryClient();

const App = () => {
  return (
    <SnackbarProvider>
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          {/* Private Routes (Protected & Wrapped with Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/home/categories/view-all" element={<Categories />} />
              <Route path="/Library/library" element={<Library />} />
              <Route path="/Library/library/:id" element={< SubcategoryTypePage />} />
              <Route path="/compose-templates" element={<ComposeTemplates />} />
              <Route path="/draft-templates" element={<DraftTemplates />} />
              <Route path="/user-templates" element={<UserTemplates />} />
              <Route path="/users" element={<Users />} />
              <Route path="/categories/:categoryId" element={<Subcategories />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
    </SnackbarProvider>

  );
};

export default App;

