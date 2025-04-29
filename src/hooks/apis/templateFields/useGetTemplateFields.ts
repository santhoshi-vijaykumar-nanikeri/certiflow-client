import { useQuery } from '@tanstack/react-query';
import { httpClient } from 'src/services/httpClient';

const useGetTemplateFields = (templateId: string | number | undefined) => {
  return useQuery({
    queryKey: ['templateFields', templateId],
    queryFn: async () => {
      if (!templateId  ||  isNaN(Number(templateId))) return [];
      const response = await httpClient.get(`/templates/${templateId}/fields`);
      return (
        response.map((field: any) => ({
          name: field.name,
          notes: field.notes || 'No additional info available',
        })) || []
      );
    },
    enabled: !!templateId, // Only fetch if templateId exists
  });
};

export default useGetTemplateFields;