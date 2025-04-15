import { useQuery } from '@tanstack/react-query';
import { httpClient } from 'src/services/httpClient';

const useGetCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => await httpClient.get('/categories'),
  });
};

export default useGetCategories;
