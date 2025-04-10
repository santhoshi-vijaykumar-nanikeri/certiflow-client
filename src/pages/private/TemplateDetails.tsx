import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useEffect,  } from 'react';
import {
  IconButton,
  Stack,
  Typography,
  TextField,
  Button,
  Autocomplete,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Divider,
} from '@mui/material';
import ArrowCircleLeftIcon from '@mui/icons-material/ArrowCircleLeft';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Editor } from '@tinymce/tinymce-react';
import DoneIcon from '@mui/icons-material/Done';
import { httpClient } from 'src/services/httpClient';
import { getUserId } from 'src/utils/helpers';

const userId = getUserId();
// ✅ Fetch Template by ID
const fetchTemplate = async (id: number) => {
  const response = await httpClient.get(`/templates/${id}`);
  return response;
};
// ✅ Fetch All Field Names
const fetchFieldNames = async () => {
  const response =  await httpClient.get('/fieldNames');
  return response;
};
// ✅ Fetch Template Fields
const fetchTemplateFields = async (templateId: number) => {
  const response = await httpClient.get(`/templates/${templateId}/fields`);
  return response;
};
// ✅ Fetch Template Text
const fetchTemplateText = async (templateId: number) => {
  try {
    const response = await httpClient.get(`/templates/${templateId}/text`);
    return response?.[0] || ''; 
  } catch (error) {
    console.error('Error fetching template text:', error);
    return ''; // Fallback value in case of error
  }
};
console.log();
const TemplateDetails = () => {
 
  const { id } = useParams<{ id: string }>();
  const templateId = Number(id);
  const [editorContent, setEditorContent] = useState('');
  const [selectedFieldName, setSelectedFieldName] = useState<{
    name: string;
  } | null>(null);
  const [fieldInfo, setFieldInfo] = useState('');
  const [fieldSize, setFieldSize] = useState('NORMAL');
  const [addedFields, setAddedFields] = useState<
    { name: string; info: string; size: string }[]
  >([]);
  const [isEditing, setIsEditing] = useState<{
    index: number | null;
    name: string;
  } | null>(null);
  const [textId, setTextId] = useState<number | null>(null); // State to hold the textId

  // Fetch Template and Field Names
  const {
    data: templateData,
    isLoading: isLoadingTemplate,
    isError,
    error,
  } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => fetchTemplate(templateId),
    enabled: !isNaN(templateId),
  });

  const { data: fieldNames, isLoading: isLoadingFields } = useQuery({
    queryKey: ['fieldNames'],
    queryFn: fetchFieldNames,
  });

  // Fetch Existing Template Fields
  const { data: existingFields } = useQuery({
    queryKey: ['templateFields', templateId],
    queryFn: () => fetchTemplateFields(templateId),
    enabled: !isNaN(templateId),
  });

  // Fetch Template Text
  const {
    data: templateText,
    isLoading: isLoadingTemplateText,
    isError: isErrorText,
    error: textError,
  } = useQuery({
    queryKey: ['templateText', templateId],
    queryFn: () => fetchTemplateText(templateId),
    enabled: !isNaN(templateId),
  });

  useEffect(() => {
    if (templateText) {
      setEditorContent(templateText?.text);
    }
  }, [templateText]); // Runs when templateText is fetched or changed

  useEffect(() => {
    if (existingFields) {
      setAddedFields(existingFields);
    }

    // Load added fields from local storage on component mount
    const savedFields = localStorage.getItem(`addedFields-${templateId}`);
    if (savedFields) {
      setAddedFields(JSON.parse(savedFields));
    }
  }, [existingFields, templateId]);

  // Update local storage whenever addedFields changes
  useEffect(() => {
    if (addedFields.length > 0) {
      localStorage.setItem(
        `addedFields-${templateId}`,
        JSON.stringify(addedFields),
      );
    }
  }, [addedFields, templateId]);

  if (isLoadingTemplateText) return <p>Loading template text...</p>;
  if (isErrorText) return <p>Error: {(textError as Error).message}</p>;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedFieldName) {
      const newField = {
        name: selectedFieldName.name,
        info: fieldInfo,
        size: fieldSize,
      };
      setAddedFields((prevFields) => [...prevFields, newField]);
      setFieldInfo(''); // Clear field info after submission
      setSelectedFieldName(null); // Reset selected field name
      setFieldSize('NORMAL'); // Reset field size
    }
  };

  const handleEdit = (
    field: { name: string; info: string; size: string },
    index: number,
  ) => {
    setIsEditing({ index, name: field.name });
  };

  const handleSaveEdit = (newName: string) => {
    if (isEditing?.index !== null && isEditing !== null) {
      const updatedFields = [...addedFields];
      updatedFields[isEditing.index].name = newName;
      setAddedFields(updatedFields);
      setIsEditing(null); // Exit edit mode
    }
  };

  const handleDelete = (fieldName: string) => {
    const updatedFields = addedFields.filter(
      (field) => field.name !== fieldName,
    );
    setAddedFields(updatedFields);
    // Optionally, send a delete request to the backend to remove the field from the template
  };

  if (isLoadingTemplate) return <p>Loading template...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  // Submit function that triggers POST request
  const submitTemplate = async (
    userId: number,
    id: string | undefined,
    textId: any,
    text:string,
    fields:any,
  ) => {
    if (!text || !addedFields.length) {
        alert('Please add content and fields before submitting.');
        return;
    }
    try {
        const formattedText = editorContent.replace(/<br>/g, "<br />\n");
      const response = await httpClient.post('/templates/composeTemplate', {
        userId,
        id,  // Ensure 'id' is passed correctly
        textId,
        text: formattedText,
        fields,
      });
  
      if (response.status === 200 && response.data.statusCode === 200) {
        console.log('Template submitted successfully:', response.data.message);
        alert(response.data.message); // This will show the success message
      }
    } catch (error) {
      console.error('Error submitting template:', error);
      // Optionally, show error message to the user
      alert('Failed to submit template. Please try again.');
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => window.history.back()} color="primary">
            <ArrowCircleLeftIcon fontSize="large" />
          </IconButton>
          <Typography variant="h6">Compose {templateData[0].name}</Typography>
        </Stack>
        <IconButton color="primary"></IconButton>
      </Stack>

      <Stack
        direction="row"
        spacing={3}
        sx={{ padding: '20px', alignItems: 'flex-start' }}
      >
        {/* Left: Form Section */}
        <Paper
          elevation={3}
          sx={{
            width: '20%',
            padding: '20px',
            marginTop: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack spacing={1}>
              {/* Autocomplete for Field Name */}
              <Stack spacing={1}>
                <Typography variant="subtitle1">Field Name</Typography>
                <Autocomplete
                  options={fieldNames || []}
                  getOptionLabel={(option) => option.name ?? ''}
                  value={selectedFieldName}
                  onChange={(_, newValue) => setSelectedFieldName(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      fullWidth
                      required
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isLoadingFields ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps?.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Stack>

              {/* Input for Field Info */}
              <Stack spacing={1}>
                <Typography variant="subtitle1">Field Info</Typography>
                <TextField
                  variant="outlined"
                  fullWidth
                  required
                  value={fieldInfo}
                  onChange={(e) => setFieldInfo(e.target.value)}
                />
              </Stack>

              {/* Field Size Selection */}
              <Stack spacing={1}>
                <Typography variant="subtitle1">Field Size</Typography>
                <ToggleButtonGroup
                  value={fieldSize}
                  exclusive
                  onChange={(_, newValue) => newValue && setFieldSize(newValue)}
                  aria-label="field size selection"
                >
                  <ToggleButton value="NORMAL">NORMAL</ToggleButton>
                  <ToggleButton value="LARGE">LARGE</ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Add
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Right: Badge List */}
        <Stack
          spacing={1}
          sx={{ marginTop: '30px', width: 'auto', maxWidth: '60%' }}
        >
          {addedFields.map((field, index) => (
            <Chip
              key={index}
              label={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {/* Render editable field name if in edit mode */}
                  {isEditing?.index === index ? (
                    <TextField
                      value={isEditing?.name || ''}
                      onChange={(e) =>
                        setIsEditing({ ...isEditing, name: e.target.value })
                      }
                      size="small"
                      sx={{
                        maxWidth: '120px',
                        backgroundColor: 'white',
                        color: 'black',
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '12px', color: 'white' }}
                    >
                      {`${field.name} `}
                    </Typography>
                  )}

                  {/* Hide edit and delete icons when editing */}
                  {isEditing?.index !== index && (
                    <>
                      <IconButton
                        size="small"
                        sx={{ color: 'white', padding: '2px' }}
                        onClick={() => handleEdit(field, index)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      {/* Delete icon to remove field */}
                      <IconButton
                        size="small"
                        sx={{ color: 'white', padding: '2px' }}
                        onClick={() => handleDelete(field.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  {/* Show "Done" button when editing */}
                  {isEditing?.index === index && (
                    <IconButton
                      size="small"
                      sx={{ color: 'white', padding: '2px' }}
                      onClick={() => handleSaveEdit(isEditing.name)}
                    >
                      <DoneIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              }
              sx={{
                backgroundColor: 'black',
                color: 'white',
                padding: '4px',
                borderRadius: '5px',
                fontSize: '12px',
                height: 'auto',
              }}
            />
          ))}
        </Stack>
      </Stack>
      {/* Divider & Editor Section */}
      <Divider sx={{ marginY: 2 }} />

      <Stack spacing={2} sx={{ width: '90%', padding: '20px' }}>
        <Typography variant="subtitle1">Text & Config</Typography>
        <Editor
          apiKey="bxbikvl8n8v10gg09cu8arqlvgmt46nb8wuai3lq0epiysti" // Replace with your actual API key
          value={editorContent}
          onEditorChange={(newValue: string) => setEditorContent(newValue)}
          init={{
            height: 300,
            menubar: false,
            plugins:
              'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen', // Removed the print plugin
            toolbar:
              'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
          }}
        />
        <Button
          variant="contained"
          color="primary"
          sx={{ alignSelf: 'flex-start', paddingX: 3, marginTop: 2 }}
          onClick={() => submitTemplate( Number(userId), id, textId, editorContent, addedFields)}
        >
          Submit
        </Button>
      </Stack>
    </>
  );
};

export default TemplateDetails;
