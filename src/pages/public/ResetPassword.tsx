import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { control, handleSubmit } = useForm<ResetPasswordForm>();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const userId = getUserId();


  const onSubmit = async (data: ResetPasswordForm) => {
    setError('');
    setSuccess('');

    if (data.newPassword !== data.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!userId) {
      setError('User not found');
      return;
    }

    try {
      const response = await httpClient.put('/users/changeDefaultPassword', {
        userId,
        newPassword: data.newPassword,
      });

      if (response?.data?.message) {
        setSuccess(response.data.message);
        localStorage.removeItem('mustResetPassword');
        setTimeout(() => navigate('/'), 3000); // Redirect to login
      } else {
        setError('Unexpected response from server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box mt={6} p={4} boxShadow={3} borderRadius={2}>
        <Typography variant="h5" gutterBottom textAlign="center">
          Reset Password
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="newPassword"
            control={control}
            defaultValue=""
            rules={{ required: 'New password is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="password"
                label="New Password"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="confirmPassword"
            control={control}
            defaultValue=""
            rules={{ required: 'Confirm password is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="password"
                label="Confirm Password"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
          >
            Reset Password
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default ResetPassword;