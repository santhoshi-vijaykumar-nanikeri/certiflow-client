import React, {  useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Info as InfoIcon } from '@mui/icons-material';
import {
  IconButton,
  Box,
  MenuItem,
  TextField,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import html2pdf from 'html2pdf.js';
import { PictureAsPdf } from '@mui/icons-material';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';
import useGetCategories from 'src/hooks/apis';
import { useSelector } from 'react-redux';
import useGetSubCategories from 'src/hooks/apis/subCategories/useGetSubCategories';


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
  id: string;
  name: string;
  userId: string;
  userCategoryId: number;
}
// API Calls

// Fetch Templates
const fetchTemplates = async (
  subcategoryId: string,
  userId: number,
  userCategoryId: number,
): Promise<Template[]> => {
  if (!subcategoryId || !userId || !userCategoryId) return [];
  try {
    const payload = {
      userId,
      userCategoryId,
    };

    const response = await httpClient.post(
      `/subcategories/${subcategoryId}/templates`,
      payload,
    );
    return response.data || [];
  } catch (error) {
    console.error('❌ Error fetching templates:', error);
    return [];
  }
};
// Fetch Template Fields
const fetchTemplateFields = async (templateId: string) => {
  try {
    const response = await httpClient.get(`/templates/${templateId}/fields`);

    return (
      response.map((field: any) => ({
        name: field.name,
        notes: field.notes || 'No additional info available',
      })) || []
    );
  } catch (error) {
    console.error('❌ Error fetching template fields:', error);
    return [];
  }
};
// Fetch Template Preview
const fetchTemplatePreview = async (templateId: string) => {
  try {
    const response = await httpClient.get(`/templates/${templateId}/text`);

    // Correctly accessing the text value
    if (response && Array.isArray(response) && response.length > 0) {
      return response[0].text || 'No preview available';
    }
    return '';
  } catch (error) {
    console.error('❌ Error fetching template preview:', error);
    return 'Error loading preview';
  }
};

const DraftTemplates: React.FC = () => {
  const { control, watch, setValue } = useForm();
  const [templateFields, setTemplateFields] = useState<
    { name: string; notes?: string }[]
  >([]);
  const [previewText, setPreviewText] = useState<string>(''); // State to hold preview text
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [previewHtml, setPreviewHtml] = useState<string>('');

  const handlePreview = async () => {
    if (!selectedTemplate) return;

    console.log('📌 Selected Template ID:', selectedTemplate);
    let templateText = await fetchTemplatePreview(selectedTemplate);
    console.log('📝 Template Before Replacement:', templateText);

    if (templateText) {
      // Replace placeholders but keep existing formatting from TinyMCE
      Object.entries(inputValues).forEach(([key, value]) => {
        // Use non-escaped placeholders like <Student Name>
        const regex = new RegExp(`&lt;${key}&gt;`, 'gi');
        templateText = templateText.replace(regex, value);
      });

      console.log('✅ Template After Replacement:', templateText);
      setPreviewHtml(templateText); // Render it directly
    }
  };
  //userCategoryId from Redux store
  const userCategoryId = useSelector(
    (state: any) => state.user.userDetails?.userCategoryId ?? 0
  );
     const selectedCategory = watch('category', '');
  const selectedSubcategory = watch('subcategory', '');
  const selectedTemplate = watch('template', '');

//Fetch Categories
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetCategories();

    const categoryId = watch('category');

  // Fetch subcategories
const { data: subcategories = [], isLoading: subcategoriesLoading, } = useGetSubCategories(categoryId);


  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['templates', selectedSubcategory, userId, userCategoryId],
    queryFn: () =>
      fetchTemplates(selectedSubcategory, Number(userId), userCategoryId),
    enabled: !!selectedSubcategory,
  });

  const handleGetFields = async () => {
    if (!selectedTemplate) return;
    const fields = await fetchTemplateFields(selectedTemplate);
    setTemplateFields(fields);
  };
  // Function to download as PDF
  const handleDownloadPDF = () => {
    const element = document.getElementById('certificate-preview');
    if (element) {
      html2pdf().from(element).save('Certificate.pdf');
    }
  };
 
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        p: 3,
      }}
    >
      {/* Dropdowns in a single row */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%' }}>
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
              sx={{ flex: 1, minWidth: '250px' }}
              onChange={(event) => {
                field.onChange(event);
                setValue('subcategory', '');
                setValue('template', '');
                setTemplateFields([]);
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

        <Controller
          name="subcategory"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Select Subcategory"
              disabled={
                !selectedCategory ||
                subcategoriesLoading ||
                subcategories.length === 0
              }
              sx={{ flex: 1, minWidth: '250px' }}
              onChange={(event) => {
                field.onChange(event);
                setValue('template', '');
                setTemplateFields([]);
              }}
            >
              {subcategories.map((subcategory:any) => (
                <MenuItem key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="template"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Select Template"
              disabled={
                !selectedSubcategory ||
                templatesLoading ||
                templates.length === 0
              }
              sx={{ flex: 1, minWidth: '250px' }}
              onChange={(event) => {
                field.onChange(event);
                setTemplateFields([]);
              }}
            >
              {templates.map((template) => (
                <MenuItem key={template.id} value={template.id}>
                  {template.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Button
          variant="contained"
          color="primary"
          disabled={!selectedTemplate}
          onClick={handleGetFields}
        >
          GET
        </Button>
      </Box>

      {/* Divider */}
      {templateFields.length > 0 && <Divider sx={{ my: 2, width: '100%' }} />}

      {/* Input Fields */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 2,
          width: '100%',
        }}
      >
        {templateFields.map((field, index) => (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            {/* Label + Info Icon */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
              }}
            >
              {field.name}
              {/* Tooltip for Info */}
              <Tooltip
                title={field.notes || 'No additional info available'}
                arrow
              >
                <IconButton size="small" sx={{ ml: 1 }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            {/* Input Field */}
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={inputValues[field.name] || ''}
              onChange={(e) =>
                setInputValues({ ...inputValues, [field.name]: e.target.value })
              }
            />{' '}
          </Box>
        ))}
      </Box>

      {/* Divider */}
      {templateFields.length > 0 && <Divider sx={{ my: 2, width: '100%' }} />}

      {/* Preview Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          p: 3,
        }}
      >
        {/* Preview Button */}
        {templateFields.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button variant="contained" color="primary" onClick={handlePreview}>
              Preview
            </Button>
          </Box>
        )}

        {/* Divider */}
        {previewText && <Divider sx={{ my: 2, width: '100%' }} />}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
          {/* Icons for PDF and Word download */}
          {previewHtml && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <IconButton onClick={handleDownloadPDF} color="error">
                <PictureAsPdf />
              </IconButton>
            </Box>
          )}

          {/* Certificate Preview */}
          {previewHtml && (
            <Box
              id="certificate-preview"
              sx={{
                mt: 3,
                p: 2,
                border: '1px solid #ccc',
                borderRadius: '8px',
                minHeight: '300px',
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DraftTemplates;
