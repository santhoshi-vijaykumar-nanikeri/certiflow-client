import React, { useState, useMemo } from 'react';
import { useSnackbar } from 'src/Components/SnackbarContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';
import {
  Box,
  MenuItem,
  TextField,
  Button,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Modal,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircle';
import SubcategoryTypeCell from './SubcategoryTypeCell';

// Type Definitions
interface Category {
  id: string;
  name: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface SubcategoryType {
  id: string;
  subcategoryId: string;
  name: string;
  subcategoryTypeValues: string;
  createdBy: string;
  createdOn: number;
}

// 🔹 API Fetch Functions
const fetchCategories = async (): Promise<Category[]> => {
  const response = await axios.get('http://localhost:3000/categories', {
    headers: { Authorization: 'Bearer ' + sessionStorage.getItem('authToken') },
  });
  return response.data.data || [];
};

const fetchSubcategories = async (
  categoryId: string,
): Promise<Subcategory[]> => {
  if (!categoryId) return [];
  const response = await axios.get(
    `http://localhost:3000/categories/${categoryId}/subcategories`,
    {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
      },
    },
  );
  return response.data.data || [];
};

const fetchSubcategoryTypes = async (
  subcategoryId: string,
): Promise<SubcategoryType[]> => {
  if (!subcategoryId) return [];
  const response = await axios.get(
    `http://localhost:3000/subcategories/${subcategoryId}/subcategoryTypes`,
    {
      headers: {
        Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
      },
    },
  );
  return response.data.data || [];
};

const SubcategorySelector: React.FC = () => {
  const { control, watch, setValue } = useForm();
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();

  const selectedCategory = watch('category') as string;
  const selectedSubcategory = watch('subcategory') as string;

  // ✅ State Management
  const [openModal, setOpenModal] = useState(false);
  const [newSubcategoryType, setNewSubcategoryType] = useState('');
  const [fetchTypes, setFetchTypes] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSubcategoryType, setEditSubcategoryType] = useState('');

  const userId = useMemo(() => {
    return sessionStorage.getItem('userId')
      ? Number(sessionStorage.getItem('userId'))
      : null;
  }, []);

  // ✅ Queries for fetching data
  // 🔹 Fetch Categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // 🔹 Fetch Subcategories (only when category is selected)
  const { data: subcategories = [], isLoading: subcategoriesLoading } =
    useQuery({
      queryKey: ['subcategories', selectedCategory],
      queryFn: () => fetchSubcategories(selectedCategory),
      enabled: !!selectedCategory, // Runs only when a category is selected
    });

  // 🔹 Fetch Subcategory Types (only when "GET" button is clicked)
  const { data: subcategoryTypes = [], refetch } = useQuery<SubcategoryType[]>({
    queryKey: ['subcategoryTypes', selectedSubcategory],
    queryFn: () => fetchSubcategoryTypes(selectedSubcategory),
    enabled: false, // ✅ Always disabled initially
  });

  // ✅ Open Edit Modal when clicking the delete (edit) icon
  const handleEditClick = (type: SubcategoryType) => {
    setEditId(String(type.id));
    setEditSubcategoryType(type.name);
  };

  // ✅ Mutation for Adding Subcategory Type
  const addSubcategoryTypeMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        'http://localhost:3000/subcategoryTypes',
        {
          userId,
          subcategoryId: selectedSubcategory,
          name: newSubcategoryType,
        },
        {
          headers: {
            Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
          },
        },
      );
    },
    onSuccess: () => {
      showSnackbar('Subcategory Type added successfully!', 'success');
      setOpenModal(false);
      setNewSubcategoryType('');
      refetch(); // ✅ Refresh subcategory types after adding
    },
  });
  // 🔹 Mutation to update the subcategory type
  const updateSubcategoryTypeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.put(
        `http://localhost:3000/subcategoryTypes`,
        { name: editSubcategoryType, userId, id: editId },

        {
          headers: {
            Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
          },
        },
      );
      return response.data; // Ensure response includes userId
    },
    onSuccess: () => {
      showSnackbar('Subcategory Type updated successfully!', 'success');

      setEditId(null); // ✅ Close modal
      refetch(); // ✅ Refresh table after updating
    },
  });

  // 🔹 Mutation to delete subcategory type
  const deleteSubcategoryTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`http://localhost:3000/subcategoryTypes/${id}`, {
        headers: {
          Authorization: 'Bearer ' + sessionStorage.getItem('authToken'),
        },
      });
    },
    onSuccess: () => {
      showSnackbar('Subcategory Type deleted successfully!', 'success');
      setDeleteId(null); // Close dialog
      refetch(); // ✅ Refresh table immediately after deletion
    },
  });

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
          disabled={!selectedSubcategory} // Disabled if no subcategory selected
          onClick={() => {
            setFetchTypes(true); // ✅ Enable fetching
            refetch(); // ✅ Manually trigger fetch
          }}
        >
          GET
        </Button>
      </Box>

      {/* ✅ Table to Display Subcategory Types */}
      {fetchTypes && (
        <Paper sx={{ padding: 2, mt: 2 }}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            {/* Add Button */}
            <IconButton color="primary" onClick={() => setOpenModal(true)}>
              <AddCircleOutlineIcon fontSize="large" />
            </IconButton>
          </Box>
          <TableContainer
            component={Paper}
            sx={{ maxHeight: 400, overflow: 'auto' }}
          >
            <Table sx={{ mt: 3 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    S.No.
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    Subcategory Type
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    Subcategory Type Values
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    Created by
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    Created on
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subcategoryTypes.length > 0 ? (
                  subcategoryTypes.map(
                    (type: SubcategoryType, index: number) => (
                      <TableRow key={type.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{type.name}</TableCell>
                        <TableCell>
                          <SubcategoryTypeCell
                            id={type.id}
                            subcategoryTypeValues={type.subcategoryTypeValues}
                          />
                        </TableCell>
                        <TableCell>{type.createdBy}</TableCell>
                        <TableCell>
                          {new Date(type.createdOn).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditClick(type)}>
                            <EditIcon color="primary" />
                          </IconButton>
                          {/* Table with delete button */}
                          <IconButton
                            onClick={() => setDeleteId(String(type.id))}
                          >
                            <DeleteIcon color="error" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ),
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No Records Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      {/* ✅ Add Subcategory Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            Add Subcategory Type
          </Typography>
          <TextField
            fullWidth
            label="Subcategory Type Name"
            value={newSubcategoryType}
            onChange={(e) => setNewSubcategoryType(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                addSubcategoryTypeMutation.mutate();
              }}
              color="primary"
              disabled={!newSubcategoryType}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6">Confirm Deletion</Typography>
          <Typography mt={1} mb={2}>
            Are you sure you want to delete this subcategory type?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              onClick={() => {
                deleteId && deleteSubcategoryTypeMutation.mutate(deleteId);
              }}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* ✅ Edit Subcategory Modal */}
      <Modal open={!!editId} onClose={() => setEditId(null)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2}>
            Edit Subcategory Type
          </Typography>
          <TextField
            fullWidth
            label="Subcategory Type Name"
            value={editSubcategoryType}
            onChange={(e) => setEditSubcategoryType(e.target.value)}
          />
          <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={() => setEditId(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                updateSubcategoryTypeMutation.mutate();
              }}
              disabled={!editSubcategoryType}
            >
              Edit
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default SubcategorySelector;
