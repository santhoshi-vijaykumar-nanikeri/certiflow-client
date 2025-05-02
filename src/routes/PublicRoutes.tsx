import React from 'react';
import Login from '../pages/public/Login';
import ResetPassword from '../pages/public/ResetPassword';

export const publicRoutes = [
  { path: '/', element: <Login /> },
  { path: '/users/changeDefaultPassword', element: <ResetPassword /> },
];