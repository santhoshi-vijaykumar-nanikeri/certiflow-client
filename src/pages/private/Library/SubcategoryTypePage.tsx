import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Button,
  Modal,
} from '@mui/material';
import { Edit, Delete, AddCircleOutline } from '@mui/icons-material';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import MyEditor from './MyEditor';
import { useSnackbar } from 'src/Components/SnackbarContext';

// ✅ API Configuration
const API_URL = 'http://localhost:3000/subcategoryTypes';
const getAuthHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

// ✅ Type Definitions
interface SubcategoryType {
  id: string;
  name?: string;
  createdBy: string;
  createdOn: string;
}

const SubcategoryTypePage: React.FC = () => {
    // ✅ Hooks for navigation and notifications
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();

  // ✅ State Management
  const [open, setOpen] = useState(false);
  const [editorData, setEditorData] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

    // ✅ Get userId from session storage
  const userId = useMemo(() => {
    return sessionStorage.getItem('userId') ? Number(sessionStorage.getItem('userId')) : null;
  }, []);

    // ✅ Fetch Subcategory Type Details
  const { data: subcategory } = useQuery({
    queryKey: ['subcategoryType', id],
    queryFn: async () =>
      (await axios.get(`${API_URL}/${id}`, { headers: getAuthHeaders() })).data
        .data[0],
    enabled: !!id,
  });

    // ✅ Fetch Subcategory Type Values (Table Data)
  const { data: tableData } = useQuery({
    queryKey: ['subcategoryTypesValue', id],
    queryFn: async () =>
      (
        await axios.get(`${API_URL}/${id}/values`, {
          headers: getAuthHeaders(),
        })
      ).data.data,
    enabled: !!id,
  });

  // ✅ Mutation: Add SubcategoryType Value
  const addMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${API_URL}/values`,
        { name: editorData, subcategoryTypeId: id, userId },
        { headers: getAuthHeaders() },
      );
      return response.data;
    },
    onSuccess: (newSubcategoryTypeValue) => {
      queryClient.setQueryData(
        ['subcategoryTypesValue', id],
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData))
            return [newSubcategoryTypeValue];
          return [...oldData, newSubcategoryTypeValue]; // Append new value
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['subcategoryTypesValue', id],
      });
      showSnackbar("SubcategoryTypeValue added successfully!", "success");
      handleClose();
    },
  });
  // ✅ Mutation: Edit SubcategoryType Value
  const updateMutation = useMutation({
    mutationFn: async () => {
      await axios.put(
        `${API_URL}/values`,
        { id: selectedId, name: editorData, userId },
        { headers: getAuthHeaders() },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategoryTypesValue'] });
      showSnackbar("SubcategoryTypeValue updated successfully!", "success");

      handleClose();
    },
  });

  // ✅ Mutation: Delete SubcategoryType Value
  const deleteMutation = useMutation({
    mutationFn: async (deleteId: string) => {
      await axios.delete(`${API_URL}/values/${deleteId}`, {
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategoryTypesValue'] }); // ✅ Correct place
      showSnackbar("SubcategoryTypeValue deleted successfully!", "success");
      setOpenDeleteModal(false);
    },
  });

    // ✅ Event Handlers
  const handleOpenDeleteModal = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setOpenDeleteModal(false);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      });
    }
  };

  const handleAddClick = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditorData('');
    setSelectedId(null);
    setEditMode(false);
  };

  const handleEditClick = (item: SubcategoryType) => {
    setEditMode(true);
    setSelectedId(item.id);
    setEditorData(item.name || '');
    setOpen(true);
  };

    // ✅ Table Columns Definition
  const columns = useMemo<ColumnDef<SubcategoryType>[]>(
    () => [
      { header: 'S.No.', cell: (info) => info.row.index + 1 },
      {
        header: 'Subcategory Type Value',
        accessorKey: 'name',
        cell: (info) => {
          const rawHtml = info.getValue() as string;
          const text = new DOMParser().parseFromString(rawHtml, 'text/html')
            .body.textContent;
          return text || 'N/A'; // Fallback in case parsing fails
        },
      },
      { header: 'Created By', accessorKey: 'createdBy' },
      {
        header: 'Created On',
        accessorKey: 'createdOn',
        cell: (info) => {
          const dateValue = info.getValue() as string | undefined;
          return dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A';
        },
      },
      {
        header: 'Actions',
        cell: ({ row }) => (
          <Box display="flex" gap={1}>
            <IconButton
              onClick={() => handleEditClick(row.original)}
              color="primary"
            >
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => handleOpenDeleteModal(row.original.id)}
              color="error"
            >
              <Delete />
            </IconButton>
          </Box>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: tableData || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={() => navigate(-1)} color="primary">
            <ArrowCircleLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>
            {subcategory?.name || 'Subcategory Type'}
          </Typography>
        </Box>
        <IconButton onClick={handleAddClick} color="primary">
          <AddCircleOutline fontSize="large" />
        </IconButton>
      </Box>

            {/* ✅ Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} sx={{ verticalAlign: 'top' }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ✅ Add/Edit Field Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography variant="h6" mb={2}>
            {editMode ? 'Edit' : 'Add'} Subcategory Type Value
          </Typography>
          <MyEditor value={editorData} onChange={setEditorData} />
          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() =>
                editMode ? updateMutation.mutate() : addMutation.mutate()
              }
              disabled={!editorData.trim()}
            >
              {editMode ? 'Update' : 'Add'}
            </Button>
          </Box>
        </Box>
      </Modal>
      
            {/* ✅ Delete Confirmation Modal */}
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

    </Container>
  );
};

export default SubcategoryTypePage;
