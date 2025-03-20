import React from "react";
import { Outlet } from "react-router-dom";
import { Container, Typography } from "@mui/material";

const HomePage = () => {
  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" textAlign="center">
        Welcome to CertiFlow
      </Typography>
      {/* Renders nested routes here */}
      <Outlet />
    </Container>
  );
};

export default HomePage;