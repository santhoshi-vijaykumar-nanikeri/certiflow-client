import React, { useEffect, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'src/components/SnackbarContext';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Modal,
  Box,
  Button,
  TextField,
  Typography,
  TableContainer,
  Paper,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';

const userId = Number(getUserId());

const Library = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // State Management
  const [activeButton, setActiveButton] = useState('Field Names');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [editField, setEditField] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ✅ Fetch Field Names
  const {
    data: fieldNames = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['fieldNames'],
    queryFn: async () => {
      const data = await httpClient.get('/fieldNames');

      return data || [];
    },
  });

  // ✅ Add Field Mutation
  const addFieldMutation = useMutation({
    mutationFn: async (newField: { name: string; userId: number }) => {
      return httpClient.post('/fieldNames', { ...newField, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldNames'] });
      showSnackbar('Field Name added successfully!', 'success');
      setIsAddModalOpen(false);
      setNewFieldName('');
    },
  });

  // ✅ Edit Field Mutation
  const editFieldMutation = useMutation({
    mutationFn: async (updatedField: {
      id: number;
      name: string;
      userId: number;
    }) => {
      return httpClient.put('/fieldNames', { ...updatedField, userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldNames'] });
      showSnackbar('Field Name updated successfully!', 'success');
      setIsEditModalOpen(false);
      setNewFieldName('');
      setEditField(null);
    },
  });

  // ✅ Delete Field Mutation
  const deleteFieldMutation = useMutation({
    mutationFn: async (id: number) => {
      return httpClient.delete(`/fieldNames/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fieldNames'] });
      showSnackbar('Field Name deleted successfully!', 'success');
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    },
  });

  // Table Columns Configuration
  const columns = [
    {
      accessorKey: 'id',
      header: 'S.No.',
      cell: (info: { row: { index: number } }) => info.row.index + 1, // Auto-numbering
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'createdBy',
      header: 'Created by',
    },
    {
      accessorKey: 'createdOn',
      header: 'Created On',
      cell: (info: { getValue: () => string | number | Date }) =>
        new Date(info.getValue()).toLocaleDateString(), // Format Date
    },
    {
      header: 'Actions',
      cell: (info: {
        row: {
          original: {
            id: React.SetStateAction<number | null>;
            name: React.SetStateAction<string>;
          };
        };
      }) => (
        <>
          <IconButton
            onClick={() => {
              setEditField({
                id: Number(info.row.original.id), // Ensure it's a number
                name: String(info.row.original.name), // Ensure it's a string
              });
              setNewFieldName(info.row.original.name);
              setIsEditModalOpen(true);
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
          <IconButton
            onClick={() => {
              setDeleteId(info.row.original.id);
              setIsDeleteModalOpen(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </>
      ),
    },
  ];

  const table = useReactTable({
    data: fieldNames,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  useEffect(() => {
    refetch(); // ✅ Fetch data when the component mounts
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {['Field Names'].map((tab) => (
          <Button
            key={tab}
            variant="contained"
            sx={{
              backgroundColor: activeButton === tab ? '#1976d2' : 'white',
              color: activeButton === tab ? 'white' : 'black',
              '&:hover': {
                backgroundColor: activeButton === tab ? '#1565c0' : '#f0f0f0',
              },
            }}
            onClick={() => setActiveButton(tab)}
          >
            {tab}
          </Button>
        ))}
      </Box>
      {/* ✅ Displays Table if "Field Names" is active & data is available */}
      {activeButton === 'Field Names' && fieldNames.length > 0 && (
        <Paper sx={{ padding: 2 }}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <IconButton color="primary" onClick={() => setIsAddModalOpen(true)}>
              <AddCircleOutlineIcon fontSize="large" />
            </IconButton>
          </Box>

          {isLoading ? (
            <Typography>Loading field names...</Typography>
          ) : (
            <TableContainer
              component={Paper}
              sx={{ maxHeight: 400, overflow: 'auto' }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: '#1976d2' }}>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableCell key={header.id} sx={{ color: 'white' }}>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
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
          )}
        </Paper>
      )}

      {/* ✅ Add Field Modal */}
      <Modal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
        <Box
          sx={{
            width: 400,
            bgcolor: 'white',
            p: 4,
            mx: 'auto',
            mt: '10%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add Field Name
          </Typography>
          <TextField
            fullWidth
            label="Field Name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                addFieldMutation.mutate({ name: newFieldName, userId: userId });
              }}
            >
              Add
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Edit Field Modal */}
      <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <Box
          sx={{
            width: 400,
            bgcolor: 'white',
            p: 4,
            mx: 'auto',
            mt: '10%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Edit Field Name
          </Typography>
          <TextField
            fullWidth
            label="Field Name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                editFieldMutation.mutate({
                  id: editField!.id,
                  name: newFieldName,
                  userId: userId,
                })
              }
            >
              Update
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <Box
          sx={{
            width: 400,
            bgcolor: 'white',
            p: 3,
            mx: 'auto',
            mt: '10%',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="h6">
            Are you sure you want to delete this item?
          </Typography>
          <Box
            sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}
          >
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => deleteFieldMutation.mutate(deleteId!)}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Library;
