import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {  useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Paper,
  Typography,
  Modal,
  Box,
  Button,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import { Delete, Edit } from '@mui/icons-material';
import { useSnackbar } from 'src/components/SnackbarContext';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';
import CustomTable from 'src/components/Table';
import useGetSubCategories from "src/hooks/apis/subCategories/useGetSubCategories"
import useGetCategoryDetails from 'src/hooks/apis/CategoryDetails/useGetCategoryDetails';

const userId = Number(getUserId());


const Subcategories = () => {
  const { categoryId } = useParams();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  // State Management
  const [open, setOpen] = useState(false);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templatesData, setTemplatesData] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Fetch subcategories
const { data: subcategories = [] } = useGetSubCategories(categoryId);

// Fetch categoryId
const { data: category} = useGetCategoryDetails(categoryId);

  const [editOpen, setEditOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [updatedName, setUpdatedName] = useState('');

  const handleEditOpen = (subcategory: {
    id: number;
    name: string;
    categoryId: number;
  }) => {
    setEditingSubcategory(subcategory);
    setUpdatedName(subcategory.name);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingSubcategory(null);
    setUpdatedName('');
  };

  // Fetch Templates when clicking on a subcategory
  const handleTemplateClick = async (
    subcategoryId: string,
    subcategoryName: string,
    templateUrl: string,
  ) => {
    if (!templateUrl) return;

    try {
      const response = await httpClient.post(
        `/subcategories/${subcategoryId}/templates`,
        { userId },
      );
      // setTemplatesData(response || []);
      const templates = Array.isArray(response.data) ? response.data : [];

      setTemplatesData(templates);
      setSelectedSubcategory(subcategoryName);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Mutation for adding a subcategory
  const addSubcategoryMutation = useMutation({
    mutationFn: async (newSubcategory: {
      name: string;
      userId: number;
      categoryId: number;
    }) => {
      return httpClient.post(`/subcategories`, {
        userId: newSubcategory?.userId,
        categoryId: categoryId,
        name: newSubcategory?.name,
      });
    },
    onSuccess: (newSubcategory) => {
      queryClient.setQueryData(['subcategories'], (oldData: any) => {
        if (!oldData) return [];
        return [...oldData, newSubcategory]; // Add new category optimistically
      });

      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
      showSnackbar('Subcategory added successfully!', 'success');
      handleClose();
    },
  });

  // Mutation for editing a subcategory
  const updateSubcategoryMutation = useMutation({
    mutationFn: async ({
      subcategoryId,
      name,
    }: {
      subcategoryId: number;
      name: string;
      userId: number;
    }) => {
      if (!subcategoryId || !name) {
        console.error('Missing subcategory data.');
        return;
      }

      const response = await httpClient.put(
        `/subcategories/`, // Pass subcategoryId in URL
        {
          id: subcategoryId,
          name: name,
          userId: userId,
        },
      );

      return response; // Ensure response includes userId
    },
    onSuccess: (updatedSubcategory) => {
      queryClient.setQueryData(
        ['subcategories', categoryId],
        (oldData: any) => {
          return oldData?.map((subcategory: any) =>
            subcategory.id === updatedSubcategory.id
              ? updatedSubcategory
              : subcategory,
          );
        },
      );

      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
      showSnackbar('Subcategory updated successfully!', 'info');
      handleEditClose();
    },
  });

  // Mutation for deleting a subcategory
  const deleteSubcategoryMutation = useMutation({
    mutationFn: async (subcategoryId: number) => {
      await httpClient.delete(`/subcategories/${subcategoryId}`);
    },
    onSuccess: (_, subcategoryId) => {
      queryClient.setQueryData(
        ['subcategories', categoryId],
        (oldData: any) => {
          return oldData?.filter(
            (subcategory: any) => subcategory.id !== subcategoryId,
          );
        },
      );
      queryClient.invalidateQueries({
        queryKey: ['subcategories', categoryId],
      });
      setOpenDeleteModal(false);
    },
  });

  /**
   * Handle Opening & Closing of Add/Edit/Delete Modals
   */
  const handleOpen = () => setOpen(true);

  const handleClose = () => {
    setOpen(false);
    setSubcategoryName('');
  };
  const handleOpenDeleteModal = (id: string) => {
    setDeleteId(id);
    setOpenDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteId(null);
    setOpenDeleteModal(false);
  };

  // Handle Add Subcategory
  const handleAddSubcategory = () => {
    if (subcategoryName.trim() === '') return;

    // Ensure userId and categoryId are properly initialized
    if (!userId || !categoryId) {
      console.error('userId or categoryId is missing!');
      return;
    }

    addSubcategoryMutation.mutate(
      { name: subcategoryName, userId, categoryId: Number(categoryId) },
      {
        onSuccess: () => {
          handleClose(); // Close modal only after successful mutation
        },
      },
    );
  };
  // Handle Update Subcategory
  const handleUpdateSubcategory = () => {
    if (!editingSubcategory) return;

    updateSubcategoryMutation.mutate(
      {
        subcategoryId: editingSubcategory.id,
        name: updatedName,
        userId: Number(userId), // Pass userId here
      },
      {
        onSuccess: () => {
          handleEditClose();
        },
      },
    );
  };

  // Handle delete Subcategory
  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteSubcategoryMutation.mutate(Number(deleteId), {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      });
    }
  };
  // Define table columns
  const columns: ColumnDef<any, any>[] = [
    {
      header: 'S.No.',
      cell: (info: { row: { index: number } }) => info.row.index + 1,
    },
    { accessorKey: 'name', header: 'Subcategory' },
    {
      accessorKey: 'templates',
      header: 'Templates',
      cell: ({ row, getValue }: { row: any; getValue: () => string }) => {
        const templateUrl = getValue();
        return templateUrl ? (
          <Link
            to="#"
            onClick={() =>
              handleTemplateClick(
                row.original.id,
                row.original.name,
                templateUrl,
              )
            }
            style={{ color: 'blue', textDecoration: 'none', cursor: 'pointer' }}
          >
            {templateUrl}
          </Link>
        ) : (
          '0'
        );
      },
    },
    { accessorKey: 'createdBy', header: 'Created By' },
    {
      accessorKey: 'createdOn',
      header: 'Created on',
      cell: (info: { getValue: () => string | number | Date }) =>
        new Date(info.getValue()).toLocaleDateString(),
    },
    {
      header: 'Actions',
      cell: ({ row }: { row: any }) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Edit
            onClick={() => handleEditOpen(row.original)}
            sx={{ cursor: 'pointer', color: 'black' }}
          />
          <Delete
            onClick={() => handleOpenDeleteModal(row.original.id)}
            sx={{ cursor: 'pointer', color: 'red' }}
          />
        </div>
      ),
    },
  ];

  const templateColumns: ColumnDef<any>[] = [
    {
      header: 'S.No.',
      cell: ({ row }) => row.index + 1,
    },
    {
      header: 'Template',
      accessorKey: 'name',
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy',
    },
    {
      header: 'Created On',
      cell: ({ row }) => new Date(row.original.createdOn).toLocaleDateString(),
    },
  ];

  return (
    <Paper sx={{ padding: 2 }}>
      {/* Header with Back Button and Add Button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => window.history.back()} color="primary">
            <ArrowCircleLeftIcon fontSize="large" />
          </IconButton>
          <Typography variant="h6">{category?.name}</Typography>
        </Stack>
        <IconButton color="primary" onClick={handleOpen}>
          <AddCircleOutlineIcon fontSize="large" />
        </IconButton>
      </Stack>

      {/* Table */}
      <CustomTable columns={columns} data={subcategories} />

      {/* Template Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            width: '80vw', // Increased width
            maxHeight: '70vh', // Limits height to 70% of viewport height
            overflowY: 'auto', // Enables vertical scrolling
            backgroundColor: 'white',
            padding: 3,
            borderRadius: 2,
            boxShadow: 24,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            {selectedSubcategory || 'No Subcategory Selected'}
          </Typography>

          <CustomTable columns={templateColumns} data={templatesData} />
          {/* Close Button */}
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}
          >
            <Button
              variant="contained"
              color="error"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Add Subcategory Modal */}
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
          <Typography variant="h6">Add Subcategory</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Subcategory Name"
            fullWidth
            variant="outlined"
            value={subcategoryName}
            onChange={(e) => setSubcategoryName(e.target.value)}
          />
          <Stack direction="row" spacing={2} mt={2}>
            <Button onClick={handleClose} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleAddSubcategory}
              color="primary"
              variant="contained"
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>
      {/* Edit Subcategory Modal */}
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
          <Typography variant="h6">Edit Subcategory</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Subcategory Name"
            fullWidth
            variant="outlined"
            value={updatedName}
            onChange={(e) => setUpdatedName(e.target.value)}
          />
          <Stack direction="row" spacing={2} mt={2}>
            <Button onClick={handleEditClose} color="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubcategory}
              color="primary"
              variant="contained"
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Delete Subcategory Modal */}
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

export default Subcategories;
