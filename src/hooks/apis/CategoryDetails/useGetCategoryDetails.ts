import { useQuery } from '@tanstack/react-query';
import { httpClient } from 'src/services/httpClient';

const useGetCategoryDetails = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['categoryDetails', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      const response = await httpClient.get(`/categories/${categoryId}`);
      return response?.length > 0 ? response[0] : null;
    },
    enabled: !!categoryId, // Only fetch if categoryId exists
  });
};

export default useGetCategoryDetails;