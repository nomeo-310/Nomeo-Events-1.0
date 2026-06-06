// hooks/use-newsletter.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { NewsletterSubscriber, Campaign } from '@/types/newsletter';
import axios from 'axios';

// ============= SUBSCRIBERS HOOKS =============

interface UseSubscribersParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const useSubscribers = (params: UseSubscribersParams = {}) => {
  return useQuery({
    queryKey: ['newsletter-subscribers', params],
    queryFn: async () => {
      const response = await axios.get('/api/admin/newsletter/subscribers', { params });
      console.log("Fetched Subscribers:", response.data);
      return response.data;
    }
  });
};

export const useSubscriber = (id: string) => {
  return useQuery({
    queryKey: ['newsletter-subscriber', id],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/newsletter/subscribers/${id}`);
      return response.data.subscriber;
    },
    enabled: !!id
  });
};

export const useAddSubscriber = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; name?: string }) => {
      const response = await axios.post('/api/admin/newsletter/subscribers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success('Subscriber added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add subscriber');
    }
  });
};

export const useUpdateSubscriber = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewsletterSubscriber> }) => {
      const response = await axios.put(`/api/admin/newsletter/subscribers/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscriber', id] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success('Subscriber updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update subscriber');
    }
  });
};

export const useDeleteSubscriber = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/newsletter/subscribers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success('Subscriber deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete subscriber');
    }
  });
};

export const useBulkSubscriberAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'subscribe' | 'unsubscribe' | 'delete' }) => {
      if (action === 'delete') {
        const response = await axios.delete('/api/admin/newsletter/subscribers', { data: { ids } });
        return response.data;
      } else {
        const response = await axios.put('/api/admin/newsletter/subscribers', { ids, action });
        return response.data;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success(`Successfully ${action}ed subscribers`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to perform action');
    }
  });
};

// ============= CAMPAIGNS HOOKS =============

interface UseCampaignsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
}

export const useCampaigns = (params: UseCampaignsParams = {}) => {
  return useQuery({
    queryKey: ['newsletter-campaigns', params],
    queryFn: async () => {
      const response = await axios.get('/api/admin/newsletter/campaigns', { params });
      return response.data;
    }
  });
};

export const useCampaign = (id: string) => {
  return useQuery({
    queryKey: ['newsletter-campaign', id],
    queryFn: async () => {
      const response = await axios.get(`/api/admin/newsletter/campaigns/${id}`);
      return response.data;
    },
    enabled: !!id
  });
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const response = await axios.post('/api/admin/newsletter/campaigns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    }
  });
};

export const useUpdateCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Campaign> }) => {
      const response = await axios.put(`/api/admin/newsletter/campaigns/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaign', id] });
      toast.success('Campaign updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update campaign');
    }
  });
};

export const useDeleteCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/newsletter/campaigns/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete campaign');
    }
  });
};

export const useSendCampaign = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.post(`/api/admin/newsletter/campaigns/${id}/send`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-campaigns'] });
      toast.success('Campaign sending started');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send campaign');
    }
  });
};

// ============= IMAGES HOOKS =============

interface UseImagesParams {
  page?: number;
  limit?: number;
  campaignId?: string;
}

export const useImages = (params: UseImagesParams = {}) => {
  return useQuery({
    queryKey: ['newsletter-images', params],
    queryFn: async () => {
      const response = await axios.get('/api/admin/newsletter/images', { params });
      return response.data;
    }
  });
};

export const useUploadImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, campaignId, alt }: { file: File; campaignId?: string; alt?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (campaignId) formData.append('campaignId', campaignId);
      if (alt) formData.append('alt', alt);
      
      const response = await axios.post('/admin/newsletter/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-images'] });
      toast.success('Image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    }
  });
};

export const useDeleteImage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/api/admin/newsletter/images?id=${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-images'] });
      toast.success('Image deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete image');
    }
  });
};

// ============= IMPORT/EXPORT HOOKS =============

export const useExportSubscribers = () => {
  return useMutation({
    mutationFn: async ({ format, status }: { format: 'csv' | 'xlsx'; status?: string }) => {
      const response = await axios.get('/api/admin/newsletter/export', {
        params: { format, status },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `newsletter-subscribers.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export subscribers');
    }
  });
};

export const useImportSubscribers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/admin/newsletter/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success(`Imported ${data.imported} subscribers successfully`);
      if (data.errors.length > 0) {
        toast.warning(`${data.errors.length} items failed to import`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to import subscribers');
    }
  });
};

// ============= STATISTICS HOOKS =============

export const useNewsletterStats = (days?: number) => {
  return useQuery({
    queryKey: ['newsletter-stats', days],
    queryFn: async () => {
      const response = await axios.get('/api/admin/newsletter/stats', { params: { days } });
      return response.data;
    }
  });
};