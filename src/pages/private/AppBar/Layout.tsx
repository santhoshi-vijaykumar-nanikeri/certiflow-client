import React from 'react';
import { Outlet } from 'react-router-dom';
import AppBarComponent from './AppBarComponent';
import { Box } from '@mui/material';

const Layout = () => {



  return (
    <Box>
      <AppBarComponent />
      <Box sx={{ marginTop: '64px', padding: '16px' }}>
       
        {/* Adjust margin if needed */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
