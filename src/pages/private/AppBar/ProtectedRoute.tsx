import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const authToken = sessionStorage.getItem("authToken");

  return authToken ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;