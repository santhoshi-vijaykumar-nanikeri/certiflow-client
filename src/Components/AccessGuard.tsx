import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '../store';

interface AccessGuardProps {
  allowedCategories?: number[];
  children: React.ReactNode;
}

const AccessGuard = ({ allowedCategories, children }: AccessGuardProps) => {
  const userCategoryId = useSelector((state: RootState) => state.user.userCategoryId);

  if (userCategoryId === null) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedCategories?.includes(userCategoryId)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
 
};

export default AccessGuard;