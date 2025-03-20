import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Modal,
  Button,
  Box,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from  "src/Components/SnackbarContext";

// Fetch templates API function
const fetchUserTemplates = async (userId: string) => {
  console.log('Fetching templates for userId:', userId);
  if (!userId) throw new Error('User ID not found');

  const response = await axios.get(
    `http://localhost:3000/templates/userTemplates/${userId}/all`,
    {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
      },
    },
  );

  return response.data.data || []; // Extract 'data' array
};

const UserTemplates = () => {
  const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();


  // State for Delete Category Modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

    // Retrieve userId from sessionStorage
  const userId = useMemo(() => {
    return String(sessionStorage.getItem('userId') || '');
  }, []);
  

  // Fetch user templates using React Query
  const { data: templates = [], isError } = useQuery({
    queryKey: ['userTemplates', userId],
    queryFn: () => (userId ? fetchUserTemplates(userId) : Promise.resolve([])),
    enabled: !!userId, // Ensures the query only runs if userId exists
  });

  // Delete Template Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(
        `http://localhost:3000/templates/userTemplates/${id}`,
        {
          headers: {
            Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
          },
        },
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ['userTemplates', userId],
        (oldData: any) =>
          oldData ? oldData.filter((template: any) => template.id !== id) : [],
      );
      queryClient.invalidateQueries({ queryKey: ['userTemplates'] });
      showSnackbar("UserTemplate deleted successfully!", "success");
      setOpenDeleteModal(false);
    },
  });

  // Handlers for Delete Modal
  const handleOpenDeleteModal = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setOpenDeleteModal(false);
  };

  const handleConfirmDelete = () => {
    if (deleteId) deleteMutation.mutate(Number(deleteId));
  };

  // Define table columns
  const columns = useMemo(
    () => [
      {
        header: 'S.No.',
        cell: (info: {
          row: {
            original: any;
            index: number;
          };
        }) => info.row.index + 1, // Display serial number starting from 1
      },
      { accessorKey: 'uuid', header: 'UUID' },
      { accessorKey: 'filename', header: 'Filename' },
      {
        accessorKey: 'createdOn',
        header: 'Created On',
        cell: (info: { getValue: () => string | number | Date }) =>
          new Date(info.getValue()).toLocaleDateString(),
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <IconButton
            onClick={() => handleOpenDeleteModal(row.original.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        ),
      },
    ],
    [],
  );

  // React Table setup
  const table = useReactTable({
    data: templates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <Typography variant="h5" gutterBottom>
        User Templates
      </Typography>

      {!userId && (
        <Typography color="error">User ID not found. Please log in.</Typography>
      )}
      {isError && (
        <Typography color="error">
          Failed to load templates. Try again later.
        </Typography>
      )}

      {/* Table */}
      {templates.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => (
                    <TableCell
                      key={header.id}
                      sx={{
                        backgroundColor: '#1976D2',
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableCell>
                  )),
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <p>No templates found.</p>
      )}

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
     
    </>
  );
};

export default UserTemplates;
