import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface LoginFormInputs {
  mobileNo: string;
  password: string;
}

// API call for login
const loginUser = async (data: LoginFormInputs) => {
  const response = await axios.post('http://localhost:3000/login', data);
  return response.data;
};

const Login = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<LoginFormInputs>();
  const [errorMessage, setErrorMessage] = useState('');

  // Mutation for login API call
  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      console.log('🔍 Full API Response:', data);
      // Extract userId correctly from data[0]
    const userId = data?.data?.[0]?.id; // ✅ Correct way to get userId

    if (!userId) {
      console.error("❌ userId is missing from the response!");
      return;
    }

      queryClient.setQueryData(['loginResponse'], data);
      sessionStorage.setItem('authToken', data?.authToken);
      sessionStorage.setItem('userId', userId.toString()); // ✅ Store userId properly
      console.log("✅ Stored userId in sessionStorage:", userId);
      navigate(`/home`);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Invalid credentials');
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
