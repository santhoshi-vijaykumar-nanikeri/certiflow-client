import { useMutation } from '@tanstack/react-query';
import { httpClient } from 'src/services/httpClient';

const usePostCategories = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
        const response = await httpClient.post('/categories', payload);
        return response.data;
      },
    });
};

export default usePostCategories;
