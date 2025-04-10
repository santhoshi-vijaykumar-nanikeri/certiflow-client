import React, { useMemo, useState } from 'react';
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
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import { PictureAsPdf, Description } from '@mui/icons-material';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';

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
// Fetch Users
const fetchUsers = async () => {
  try {
    const response = await httpClient.get('/users');
    return response || [];
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};
// Fetch Categories
const fetchCategories = async () => {
  try {
    const response = await httpClient.get('/categories');
    return response || [];
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
};
// Fetch Subcategories
const fetchSubcategories = async (
  categoryId: string,
): Promise<Subcategory[]> => {
  if (!categoryId) return [];
  try {
    const response = await httpClient.get(
      `/categories/${categoryId}/subcategories`,
    );
    return response || [];
  } catch (error) {
    console.error('❌ Error fetching subcategories:', error);
    return [];
  }
};
// Fetch Templates
const fetchTemplates = async (
  subcategoryId: string,
  userId: number,
  userCategoryId: number,
): Promise<Template[]> => {
  if (!subcategoryId || !userId || !userCategoryId) return [];
  try {
    const response = await httpClient.post(
      `/subcategories/${subcategoryId}/templates`,
      {
        userId,
        userCategoryId,
      },
    );
    return response || [];
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
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
  const userCategoryId = useMemo(
    () => (users.length > 0 ? users[0].userCategoryId : 0),
    [users],
  );

  const selectedCategory = watch('category', '');
  const selectedSubcategory = watch('subcategory', '');
  const selectedTemplate = watch('template', '');

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: subcategories = [], isLoading: subcategoriesLoading } =
    useQuery({
      queryKey: ['subcategories', selectedCategory],
      queryFn: () => fetchSubcategories(selectedCategory),
      enabled: !!selectedCategory,
    });
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

  // Function to download as Word (.docx)

  const handleDownloadWord = async () => {
    const contentElement = document.getElementById('certificate-preview');
    if (!contentElement) return;

    const content = contentElement.innerHTML;

    // Ensure Word-compatible structure
    const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 14px; }
        </style>
      </head>
      <body>
        <div>${content}</div>
      </body>
    </html>`;

    try {
      let converted = await asBlob(htmlContent);

      // 🔹 Convert Buffer to Blob if necessary
      if (!(converted instanceof Blob)) {
        converted = new Blob([converted], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      }

      console.log('✅ Final Blob Ready:', converted);
      saveAs(converted, 'Certificate.docx');
    } catch (error) {
      console.error('❌ Error generating Word document:', error);
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
              {subcategories.map((subcategory) => (
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
              <IconButton onClick={handleDownloadWord} color="primary">
                <Description />
              </IconButton>
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
