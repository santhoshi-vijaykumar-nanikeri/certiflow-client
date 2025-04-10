import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import {
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';
import { usePrivateRouter } from 'src/context/PrivateRouterContext';
import { logoutUser } from 'src/utils/logout';
import { useDispatch } from 'react-redux';

const AppBarComponent = () => {
  const dispatch = useDispatch();
  const { setAuthStatus } = usePrivateRouter();
  const userId = Number(getUserId());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // API call to fetch user details
  const fetchUserDetails = async () => {
    const response = await httpClient.get(`/users/${userId}/userDetails`);

    return response?.[0]; // Extracting the first object inside 'data' array
  };
  // Fetch user details (disabled auto-fetch)
  const { data: userDetails, refetch: refetchUserDetails } = useQuery({
    queryKey: ['userDetails'],
    queryFn: fetchUserDetails,
    enabled: false, // Disable auto-fetch
  });

  // Password update mutation
  const mutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      oldPassword: string;
      newPassword: string;
    }) => {
      const response = await httpClient.put('/users/changePassword', data);
      return response;
    },
    onSuccess: () => {
      setSuccessMessage('Password updated successfully!');
      setErrorMessage('');
      setFormData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordDialogOpen(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setErrorMessage(
        error.response?.data?.message || 'Failed to update password',
      );
    },
  });

  // Event handlers
  const handleProfileOpen = async () => {
    await refetchUserDetails();
    setProfileOpen(true);
    handleCloseMenu();
  };
  const handleProfileClose = () => setProfileOpen(false);

  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
    handleCloseMenu();
  };
  const handlePasswordDialogClose = () => setPasswordDialogOpen(false);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) =>
    setMenuAnchor(event.currentTarget);
  const handleCloseMenu = () => setMenuAnchor(null);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logoutUser(dispatch, setAuthStatus);
      navigate('/', { replace: true });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setErrorMessage('New password and confirm password do not match');
      return;
    }

    mutation.mutate({
      userId: Number(userId),
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <>
      {/*  APP BAR */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            CertiFlow
          </Typography>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', gap: 3 }}>
            <MenuItem onClick={() => navigate('/home/categories/view-all')}>
              Categories
            </MenuItem>
            <MenuItem onClick={() => navigate('/home/library')}>
              Library
            </MenuItem>
            <MenuItem onClick={() => navigate('/home/templates/view-all')}>
              Compose Templates
            </MenuItem>
            <MenuItem onClick={() => navigate('/home/draft-templates')}>
              Draft Templates
            </MenuItem>
            <MenuItem onClick={() => navigate('/home/user-templates/view-all')}>
              User Templates
            </MenuItem>
            <MenuItem onClick={() => navigate('/home/users')}>Users</MenuItem>
          </Box>

          {/* User Profile Menu*/}
          <IconButton onClick={handleMenuOpen} color="inherit">
            <Avatar />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={handleCloseMenu}
          >
            <MenuItem onClick={handleProfileOpen}>Profile Details</MenuItem>
            <MenuItem onClick={handlePasswordDialogOpen}>
              Change Password
            </MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Profile Dialog */}
      <Dialog
        open={profileOpen}
        onClose={handleProfileClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle></DialogTitle>
        <DialogContent>
          {userDetails ? (
            <Box>
              <Typography variant="h6">Name: {userDetails?.name}</Typography>
              <Typography variant="h6">
                Category: {userDetails?.userCategory || 'N/A'}
              </Typography>
              <Typography variant="h6">
                Mobile: {userDetails?.mobileNo || 'N/A'}
              </Typography>
            </Box>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Old Password"
            type="password"
            fullWidth
            margin="normal"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          {errorMessage && (
            <Typography color="error" sx={{ mt: 2, mb: 1 }}>
              {errorMessage}
            </Typography>
          )}
          {successMessage && (
            <Typography color="success.main" sx={{ mt: 2, mb: 1 }}>
              {successMessage}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AppBarComponent;
