import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import React, { useState } from 'react';
import {
  Paper,
  Box,
  IconButton,
  Typography,
  Modal,
  Button,
  TextField,
  FormControl,
  MenuItem,
  Select,
  InputLabel,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
// import BlockIcon from '@mui/icons-material/Block';
// import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useSnackbar } from 'src/components/SnackbarContext';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';
import CustomTable from 'src/components/Table';

interface UserPayload {
  id?: number;
  mobileNo: string;
  name: string;
  userCategoryId: string;
  userId: number;
}

interface FormData {
  name: string;
  mobileNo: string;
  userCategoryId: string;
  password?: string;
}

const defaultFormValues: FormData = {
  name: '',
  mobileNo: '',
  userCategoryId: '',
  password: 'password',
};

const Users = () => {
  const userId = Number(getUserId());
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const [openAddUserModal, setOpenAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPayload | null>(null);
  const [openEditUserModal, setOpenEditUserModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  // const [userCategories, setUserCategories] = useState([]);

  const { control, handleSubmit, reset } = useForm<FormData>({
    defaultValues: defaultFormValues,
  });

  const { data, error, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => await httpClient.get('/users'),
  });

  const { data: userCategories = [] } = useQuery<any[], Error>({
    queryKey: ['userCategories'],
    queryFn: async () => {
      const res = await httpClient.get('/users/userCategories');
      return res;
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (newUser: UserPayload) =>
      await httpClient.post('/users', newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSnackbar('User added successfully', 'success');
      handleCloseAddUserModal();
    },
    onError: () => showSnackbar('Failed to add user', 'error'),
  });

  const editUserMutation = useMutation({
    mutationFn: async (updatedUser: UserPayload) =>
      await httpClient.put('/users', updatedUser),
    onSuccess: (data: any) => {
      if (data?.statusCode === 409)
        return showSnackbar('User exists!', 'error');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSnackbar('User updated successfully', 'success');
      handleCloseEditModal();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.data?.message || error?.message || 'Something went wrong!';
      const statusCode = error?.status || error?.statusCode;
      statusCode === 409
        ? showSnackbar('User exists!', 'error')
        : showSnackbar(errorMessage, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await httpClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showSnackbar('User deleted successfully', 'success');
      handleCloseDeleteModal();
    },
  });

  const onSubmit = (data: FormData) => {
    if (!userId) return console.error('User ID is missing!');
    addUserMutation.mutate({ ...data, userId });
  };

  const handleEditSubmit = (data: FormData) => {
    if (!selectedUser || !userId) return;
    editUserMutation.mutate({ ...data, id: selectedUser.id, userId });
  };

  const handleOpenAddUserModal = () => {
    reset(defaultFormValues);
    setOpenAddUserModal(true);
  };

  const handleCloseAddUserModal = () => {
    reset(defaultFormValues);
    setOpenAddUserModal(false);
  };

  const handleOpenEditModal = (user: UserPayload) => {
    setSelectedUser(user);
    reset({
      name: user.name,
      mobileNo: user.mobileNo,
      userCategoryId: user.userCategoryId,
    });
    setOpenEditUserModal(true);
  };

  const handleCloseEditModal = () => {
    reset(defaultFormValues);
    setSelectedUser(null);
    setOpenEditUserModal(false);
  };

  const handleOpenDeleteModal = (id: number) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setOpenDeleteModal(false);
  };

  const handleConfirmDelete = () => {
    if (deleteId !== null) deleteMutation.mutate(deleteId);
  };

  const columns = [
    { header: 'S.No.', cell: ({ row }: any) => row.index + 1 },
    { accessorKey: 'name', header: 'User' },
    { accessorKey: 'userCategory', header: 'User Category' },
    { accessorKey: 'mobileNo', header: 'Mobile No' },
    { accessorKey: 'createdBy', header: 'Created By' },
    {
      accessorKey: 'createdOn',
      header: 'Created On',
      cell: ({ getValue }: any) => new Date(getValue()).toLocaleDateString(),
    },
    { accessorKey: 'templates', header: 'Templates' },
    {
      header: 'Actions',
      cell: ({ row }: any) => (
        <Box display="flex" gap={1}>
          <IconButton
            onClick={() => handleOpenEditModal(row.original)}
            color="primary"
          >
            <Edit />
          </IconButton>
          {/* <IconButton color="error"><BlockIcon /></IconButton> */}
          {/* <IconButton color="primary"><LockOpenIcon /></IconButton> */}
          <IconButton
            onClick={() => handleOpenDeleteModal(row.original.id)}
            color="error"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error: {(error as Error).message}</p>;

  return (
    <Paper sx={{ padding: 2 }}>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton color="primary" onClick={handleOpenAddUserModal}>
          <AddCircleOutlineIcon fontSize="large" />
        </IconButton>
      </Box>
      <CustomTable columns={columns} data={data || []} />

      {/* Add User Modal */}
      <Modal open={openAddUserModal} onClose={handleCloseAddUserModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" mb={2}>
            Add New User
          </Typography>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormControl fullWidth margin="normal">
              <InputLabel>User Category</InputLabel>
              <Controller
                name="userCategoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="User Category"
                    value={field.value || ''}
                  >
                    {userCategories.map((category: any) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="normal"
                  label="Name"
                  required
                />
              )}
            />

            <Controller
              name="mobileNo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  margin="normal"
                  label="Mobile No"
                  required
                />
              )}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Password"
              value="password"
              disabled
            />

            <Box mt={2} display="flex" justifyContent="space-between">
              <Button
                onClick={handleCloseAddUserModal}
                variant="outlined"
                color="secondary"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={addUserMutation.isPending}
              >
                {addUserMutation.isPending ? 'Adding...' : 'Add'}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={openEditUserModal} onClose={handleCloseEditModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" mb={2}>
            Edit User
          </Typography>
          {selectedUser && (
            <form onSubmit={handleSubmit(handleEditSubmit)}>
              <FormControl fullWidth margin="normal">
                <InputLabel>User Category</InputLabel>
                <Controller
                  name="userCategoryId"
                  control={control}
                  defaultValue={selectedUser.userCategoryId}
                  render={({ field }) => (
                    <Select
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      label="User Category"
                    >
                      <MenuItem value="" disabled>
                        Select User Category
                      </MenuItem>
                      {userCategories.map((category: any) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              <Controller
                name="name"
                control={control}
                defaultValue={selectedUser.name}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    margin="normal"
                    label="Name"
                    required
                  />
                )}
              />

              <Controller
                name="mobileNo"
                control={control}
                defaultValue={selectedUser.mobileNo}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    margin="normal"
                    label="Mobile No"
                    required
                  />
                )}
              />

              <Box mt={2} display="flex" justifyContent="space-between">
                <Button onClick={handleCloseEditModal} color="secondary">
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary">
                  Update
                </Button>
              </Box>
            </form>
          )}
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={openDeleteModal} onClose={handleCloseDeleteModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" mb={2}>
            Are you sure you want to delete this item?
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button onClick={handleCloseDeleteModal} color="secondary">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </Paper>
  );
};

export default Users;
