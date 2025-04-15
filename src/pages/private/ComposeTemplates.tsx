import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'src/components/SnackbarContext';
import {
  Box,
  MenuItem,
  TextField,
  Button,
  Paper,
  IconButton,
  Typography,
  Modal,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import { useNavigate } from 'react-router-dom';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';
import useGetCategories from 'src/hooks/apis';
import CustomTable from 'src/components/Table';

const userId = getUserId();

// Type Definitions
interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface Template {
  id: number;
  name: string;
  userId: number;
  createdBy: string;
  createdOn: string;
}

type TemplateType = { id: number; userId: number; name: string };

// Fetch subcategories for a given category
const fetchSubcategories = async (
  categoryId: string,
): Promise<Subcategory[]> => {
  if (!categoryId) return [];
  return await httpClient.get(`/categories/${categoryId}/subcategories`);
};

// Fetch templates for a subcategory
const fetchSubcategoryTemplate = async (
  subcategoryId: string,
  userId: string | null,
): Promise<Template[]> => {
  if (!subcategoryId || !userId) return [];
  return await httpClient.post(`/subcategories/${subcategoryId}/templates`, {
    userId,
  });
};

// Add a new template
const addTemplate = async (
  templateName: string,
  subcategoryId: string,
  userId: string | null,
) => {
  return await httpClient.post('/templates', {
    name: templateName,
    subcategoryId,
    userId,
  });
};

// Update an existing template
const updateTemplate = async (
  templateId: number,
  userId: number,
  newName: string,
) => {
  await httpClient.put('/templates', { id: templateId, userId, name: newName });
};
// Delete a template by ID
const deleteTemplate = async (templateId: number) => {
  await httpClient.delete(`/templates/${templateId}`);
};

// 🔹 Main Component
const ComposeTemplate: React.FC = () => {
  // Form handling
  const { control, watch, setValue } = useForm();
  const { showSnackbar } = useSnackbar();
  // Form state tracking
  const selectedCategory = watch('category') as string;
  const selectedSubcategory = watch('subcategory') as string;

  // Component State
  const [templatesData, setTemplatesData] = useState<Template[]>([]);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<TemplateType | null>(null);
  const [fetchTypes, setFetchTypes] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const navigate = useNavigate();

  // 🔹 Fetch Categories
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetCategories();

  // 🔹 Fetch Subcategories (only when category is selected)
  const { data: subcategories = [], isLoading: subcategoriesLoading } =
    useQuery({
      queryKey: ['subcategories', selectedCategory],
      queryFn: () => fetchSubcategories(selectedCategory),
      enabled: !!selectedCategory, // Runs only when a category is selected
    });

  // Fetch templates when "GET" button is clicked
  const { data: templates = [], refetch } = useQuery<Template[]>({
    queryKey: ['templates', selectedSubcategory, userId],
    queryFn: () => fetchSubcategoryTemplate(selectedSubcategory, userId),
    enabled: false, // ✅ Initially disabled, refetch manually
  });

  // Sync template data when fetched
  React.useEffect(() => {
    if (templates.length > 0) {
      setTemplatesData(templates);
    }
  }, [templates]);

  // Add template mutation
  const mutation = useMutation({
    mutationFn: () => {
      return addTemplate(newTemplateName, selectedSubcategory, userId);
    },
    onSuccess: () => {
      setOpenAddModal(false);
      setNewTemplateName('');
      refetch();
      showSnackbar('Template added successfully!', 'success'); // ✅ Show success message
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      name,
    }: {
      id: number;
      userId: number | string | null; // Ensure it allows different types
      name: string;
    }) => {
      return updateTemplate(id, Number(userId), name);
    },
    onSuccess: () => {
      setOpenEditModal(false);
      refetch(); // Refresh templates list
      showSnackbar('Template updated successfully!', 'success');
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      showSnackbar('Template deleted successfully!', 'success'); // ✅ Show success message
      setOpenDeleteModal(false);
      refetch();
    },
  });

  const handleComposeClick = (id: number) => {
    navigate(`/home/templates/${id}`);
  };

    // Define table columns
  const columns = [
    {
      header: 'S.No.',
      accessorKey: 'serialNumber',  // This is for the serial number column
    },
    {
      header: 'Template',
      accessorKey: 'name',
    },
    {
      header: 'Created by',
      accessorKey: 'createdBy',
    },
    {
      header: 'Created on',
      accessorKey: 'createdOn',
      cell: (info: any) => new Date(info.getValue()).toLocaleDateString(),  // Format the date
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (info: any) => (
        <Box display="flex" justifyContent="space-between">
          <IconButton
            onClick={() => {
              setEditTemplate({
                id: info.row.original.id,
                userId: info.row.original.userId,
                name: info.row.original.name,
              });
              setOpenEditModal(true);
            }}
          >
            <EditIcon color="primary" />
          </IconButton>
          <IconButton
            onClick={() => {
              setDeleteId(info.row.original.id);
              setOpenDeleteModal(true);
            }}
          >
            <DeleteIcon color="error" />
          </IconButton>
        </Box>
      ),
    },
    {
      header: 'Compose',
      accessorKey: 'compose',
      cell: (info: any) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleComposeClick(info.row.original.id)}
        >
          COMPOSE
        </Button>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
        {/* ✅ Category Dropdown */}
        <Controller
          name="category"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Select Category"
              disabled={categoriesLoading}
              sx={{ width: 250 }}
              slotProps={{
                select: {
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 200, overflowY: 'auto' }, // 👈 Makes dropdown scrollable
                    },
                  },
                },
              }}
              onChange={(event) => {
                field.onChange(event); // ✅ Update selected category
                setValue('subcategory', ''); // ✅ Reset subcategory
                setFetchTypes(false); // ✅ Hide the table when category changes
              }}
            >
              {categories.map((category: Category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ✅ Subcategory Dropdown */}
        <Controller
          name="subcategory"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Select Subcategory"
              disabled={subcategoriesLoading || !selectedCategory}
              sx={{ width: 250 }}
              slotProps={{
                select: {
                  MenuProps: {
                    PaperProps: {
                      style: { maxHeight: 200, overflowY: 'auto' }, // 👈 Makes dropdown scrollable
                    },
                  },
                },
              }}
            >
              {subcategories.map((subcategory: Subcategory) => (
                <MenuItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ✅ GET Button */}
        <Button
          variant="contained"
          color="primary"
          disabled={!selectedSubcategory}
          onClick={() => {
            setFetchTypes(true);
            refetch(); // ✅ Manually trigger data fetching
          }}
        >
          GET
        </Button>
      </Box>

      {/* ✅ Table to Display Subcategory Types */}
      {fetchTypes && (
  <Paper sx={{ padding: 2, mt: 2 }}>
    <Box display="flex" justifyContent="flex-end" mb={2}>
      <IconButton color="primary" onClick={() => setOpenAddModal(true)}>
        <AddCircleOutlineIcon fontSize="large" />
      </IconButton>
    </Box>

    <CustomTable
      data={templatesData.map((template, index) => ({
        serialNumber: index + 1,  // Add serial number dynamically
        name: template.name,
        createdBy: template.createdBy,
        createdOn: template.createdOn,
        id: template.id,
        userId: template.userId,
      }))}
      columns={columns}
    />
  </Paper>
)}
      {/* Add Template Modal */}
      <Modal open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'white',
            width: 300,
            mx: 'auto',
            mt: 10,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Add New Template</Typography>
          <TextField
            fullWidth
            label="Template Name"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => mutation.mutate()}>
              Add
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Edit Template Modal */}
      <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
        <Box
          sx={{
            p: 3,
            bgcolor: 'white',
            width: 300,
            mx: 'auto',
            mt: '10%',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6">Edit Template</Typography>
          <TextField
            fullWidth
            label="Template Name"
            value={editTemplate?.name || ''}
            onChange={(e) =>
              setEditTemplate((prev) =>
                prev ? { ...prev, name: e.target.value } : null,
              )
            }
            sx={{ mt: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button onClick={() => setOpenEditModal(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (editTemplate) {
                  updateMutation.mutate({
                    id: editTemplate.id,
                    userId: editTemplate.userId, // Ensure userId is passed
                    name: editTemplate.name,
                  });
                }
              }}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <Box sx={{ p: 3, bgcolor: 'white', width: 300, mx: 'auto', mt: '20%' }}>
          <Typography variant="h6">Confirm Deletion</Typography>
          <Typography>
            Are you sure you want to delete this template?
          </Typography>
          <Box mt={2} display="flex" justifyContent="space-between">
            <Button
              onClick={() => setOpenDeleteModal(false)}
              variant="contained"
              color="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deleteId !== null) {
                  deleteMutation.mutate(deleteId);
                }
              }}
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ComposeTemplate;
