import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Box,
  IconButton,
  Modal,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { useSnackbar } from 'src/Components/SnackbarContext';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';

// Type Definitions
interface Category {
  userId: number;
  id: number;
  name: string;
  subcategories?: number;
  createdBy?: string;
  createdOn?: string;
}


// Fetch Categories
const fetchCategories = async () => {
  const response = await httpClient.get('/categories');
  return response; // Ensure correct extraction
};

const Categories = () => {
  const userId = getUserId();

  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // Fetch categories using React Query
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // State Management for Modals
  const [open, setOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Open/Close Handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setCategoryName(''); // Reset field when closing modal
  };

 
  const handleOpenDeleteModal = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setOpenDeleteModal(false);
  };


  // Add Category Mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (newCategory: { name: string; userId: number }) => {
      if (!userId) {
        console.error('User ID is missing! Cannot create category.');
        return;
      }

      return httpClient.post('/categories', {
        name: newCategory?.name,
        userId: Number(userId),
      });
    },
    onSuccess: (newCategory) => {
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return [];
        return [...oldData, newCategory]; // Add new category optimistically
      });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSnackbar('Category added successfully!', 'success');
      handleClose(); // Close modal after success
    },
  });

  // Update Category Mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (updatedCategory: Category) => {
      if (!updatedCategory.id || !updatedCategory.name) {
        console.error('Missing category data.');
        return;
      }
      if (!userId) {
        console.error('User ID is missing! Cannot update category.');
        return;
      }

      return httpClient.put(`/categories`, {
        ...updatedCategory,
        userId: Number(userId),
      });
    },
    onSuccess: (updatedCategory) => {
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return [];
        return oldData.map((category: Category) =>
          category.id === updatedCategory.id ? updatedCategory : category,
        );
      });

      queryClient.invalidateQueries({ queryKey: ['categories'] }); // Ensure fresh data from backend
      showSnackbar('Category updated successfully!', 'success');
      handleEditClose(); // ✅ Close the modal after updating
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) =>
      httpClient.delete(`/categories/${categoryId}`),
    onSuccess: (_, categoryId) => {
      // ✅ Remove the deleted category from the UI
      queryClient.setQueryData(['categories'], (oldData: any) => {
        if (!oldData) return [];
        return oldData.filter((category: any) => category?.id !== categoryId);
      });

      // ✅ Also refetch data to ensure accurate sync
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      showSnackbar('Category deleted successfully!', 'success');
      setOpenDeleteModal(false);
    },
  });

  // Handle Add Category
  const handleAddCategory = () => {
    if (!categoryName.trim()) return; // Prevent empty submissions
    if (!userId) {
      console.error('User ID is missing from localStorage!');
      return;
    }
    addCategoryMutation.mutate(
      { name: categoryName, userId: Number(userId) },
      {
        onSuccess: () => {
          handleClose(); // Close modal only after successful mutation
        },
      },
    );
  };
  // Handle Edit Click
  const handleEdit = (category?: Category) => {
    if (!category || !category.name) {
      console.error('Category is missing a name:', category);
      return; // Prevent setting incomplete data
    }
    setEditCategory(category);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditCategory(null); // Reset the editCategory state when closing the modal
  };


  // Handle Deleting a Category
  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteCategoryMutation.mutate(Number(deleteId), {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      });
    }
  };

  // Define table columns
  const columns = [
    {
      header: 'S.No.',
      cell: (info: { row: { index: number } }) => info?.row?.index + 1, // Display serial number starting from 1
    },
    {
      accessorKey: 'name',
      header: 'Category Name',
      
    },
    {
      accessorKey: 'subcategories',
      header: 'Subcategories',
      cell: (info: { row: { original: Category } }) => (
        <Link
          to={`/home/categories/${info?.row?.original?.id}`}
          style={{ color: 'blue', textDecoration: 'none' }}
        >
          {info?.row?.original?.subcategories}
        </Link>
      ),
    },

    {
      accessorKey: 'createdBy',
      header: 'Created By', // New column for Created By
    },
    {
      accessorKey: 'createdOn',
      header: 'Created On',
      cell: (info: { getValue: () => string | number | Date }) =>
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <Edit
          
            onClick={() =>{
              console.log('row.original on Edit click:', row?.original);
              handleEdit(row?.original)}}
            sx={{ cursor: 'pointer', color: 'black' }}
          />
          <Delete
            onClick={() => handleOpenDeleteModal(row?.original?.id)}
            sx={{ cursor: 'pointer', color: 'red' }}
          />
        </div>
      ),
    },
  ];

  // Initialize TanStack Table
  const table = useReactTable({
    data: categories,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) return <p>Loading categories...</p>;
  if (isError) return <p>Error fetching categories.</p>;

  return (
    <Paper sx={{ padding: 2 }}>
      {/* Add Category Button on Top Right */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton color="primary" onClick={handleOpen}>
          <AddCircleOutlineIcon fontSize="large" />
        </IconButton>
      </Box>
      {/* Categories Table */}
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
            {table.getRowModel().rows?.map((row) => (
              <TableRow key={row?.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Category Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            width: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Add New Category</Typography>
          <TextField
            label="Category Name"
            variant="outlined"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={handleClose} color="secondary" variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              color="primary"
              variant="contained"
              disabled={addCategoryMutation.isPending}
            >
              {addCategoryMutation.isPending ? 'Adding...' : 'Add'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Edit Category Modal */}
      <Modal open={editOpen} onClose={handleEditClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 3,
            borderRadius: 2,
            width: 400,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Typography variant="h6">Edit Category</Typography>
          <TextField
            label="Category Name"
            variant="outlined"
            fullWidth
            value={editCategory?.name || ''}
            onChange={(e) =>
              setEditCategory((prev) =>
                prev ? { ...prev, name: e.target.value } : prev,
              )
            }
          />
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              onClick={() => setEditOpen(false)}
              color="secondary"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editCategory) updateCategoryMutation.mutate(editCategory);
              }}
              color="primary"
              variant="contained"
            >
              Update
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
    </Paper>
  );
};

export default Categories;
