// hooks/use-newsletter.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';

interface SubscribeData {
  email: string;
  name?: string;
}

interface UnsubscribeData {
  email?: string;
  token?: string;
}

interface SubscribeResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    status: string;
  };
}

// Subscribe to newsletter
export const useSubscribeNewsletter = () => {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  
  return useMutation({
    mutationFn: async (data: SubscribeData) => {
      // Auto-include userId if user is logged in
      const payload = {
        email: data.email,
        name: data.name,
        userId: session?.user?.id, // Automatically add userId from session
      };
      const response = await axios.post('/api/newsletter/subscribe', payload);
      return response.data;
    },
    onSuccess: (data: SubscribeResponse, variables) => {
      if (data.success) {
        toast.success(data.message);
        // Invalidate status query for this email
        queryClient.invalidateQueries({ queryKey: ['newsletter-status', variables.email] });
      } else if (data.message === 'Email already subscribed') {
        toast.info(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to subscribe. Please try again.');
    },
  });
};

// Unsubscribe from newsletter
export const useUnsubscribeNewsletter = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UnsubscribeData) => {
      const response = await axios.post('/api/newsletter/unsubscribe', data);
      return response.data;
    },
    onSuccess: (data: SubscribeResponse, variables) => {
      if (data.success) {
        toast.success(data.message);
        if (variables.email) {
          queryClient.invalidateQueries({ queryKey: ['newsletter-status', variables.email] });
        }
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unsubscribe. Please try again.');
    },
  });
};

// Check subscription status
export const useNewsletterStatus = (email: string | null) => {
  return useQuery({
    queryKey: ['newsletter-status', email],
    queryFn: async () => {
      if (!email) return null;
      const response = await axios.get(`/api/newsletter/status?email=${encodeURIComponent(email)}`);
      return response.data.data;
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};