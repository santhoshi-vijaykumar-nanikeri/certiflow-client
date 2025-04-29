import { useQuery } from '@tanstack/react-query';
import { httpClient } from 'src/services/httpClient';

const useGetSubCategories = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ['subcategories', categoryId], // Unique key per category
   queryFn: async () => {
      const response = await httpClient.get(`/categories/${categoryId}/subcategories`);
      return response || [];
    },
    enabled: !!categoryId, // Only run if categoryId is truthy
  });
};

export default useGetSubCategories;
