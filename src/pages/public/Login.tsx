import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { usePrivateRouter } from 'src/context/PrivateRouterContext';
import { useDispatch } from 'react-redux';
import { setUserDetails } from 'src/store/slices/userSlice'; 

interface LoginFormInputs {
  mobileNo: string;
  password: string;
}

// API call
const loginUser = async (data: LoginFormInputs) => {
  const response = await axios.post('http://localhost:3000/login', data);
  return response.data;
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuthStatus } = usePrivateRouter(); // ✅ Access auth context
  const { control, handleSubmit } = useForm<LoginFormInputs>();
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      console.log('🔍 Full API Response:', data);
      const userId = data?.data?.[0]?.userId || data?.data?.[0]?.id;
      const token = data?.authToken;
      const loginCount = data?.data?.[0]?.loginCount;
      const statusCode = data?.statusCode;
      if (!userId) {
        console.error('❌ Missing userId in response!');
        setErrorMessage('Something went wrong. Please try again.');
        return;
      }
    
      if (statusCode === 205 || loginCount === 1) {
        localStorage.setItem('userId', userId.toString());
        localStorage.setItem('mustResetPassword', 'true'); // optional flag
        navigate('/users/changeDefaultPassword');
        return;
      }
    
      if (!token) {
        console.error('❌ Missing token in response!');
        setErrorMessage('Something went wrong. Please try again.');
        return;
      }
    
      // ✅ Normal login flow
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('userDetails', JSON.stringify(data?.data?.[0])); 
      dispatch(setUserDetails(data?.data?.[0])); // ✅ userDetails sent to Redux
      console.log('Dispatched:', data?.data?.[0]);
      setAuthStatus(true);
      navigate('/home');
    },
    onError: (error: any) => {
      console.error('❌ Login error:', error);
      setErrorMessage(
        error.response?.data?.message || 'Invalid credentials'
      );
    },
  });

  const onSubmit = (data: LoginFormInputs) => {
    setErrorMessage('');
    mutate(data);
  };

  return (
    <Container maxWidth="sm">
      <Box mt={5} p={3} boxShadow={3} borderRadius={2}>
        <Typography variant="h4" textAlign="center" gutterBottom>
          Login
        </Typography>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Mobile Number Input Field */}
          <Controller
            name="mobileNo"
            control={control}
            defaultValue=""
            rules={{
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10}$/, // Only 10-digit numbers allowed
                message: 'Enter a valid 10-digit mobile number',
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Mobile Number"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                type="tel"
                inputMode="numeric"
              />
            )}
          />
          {/* Password Input Field */}
          <Controller
            name="password"
            control={control}
            defaultValue=""
            rules={{ required: 'Password is required' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Password"
                type="password"
                fullWidth
                margin="normal"
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
          {errorMessage && (
            <Typography color="error">{errorMessage}</Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={isPending} // Disable while submitting
          >
            {isPending ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
