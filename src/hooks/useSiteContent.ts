import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  [key: string]: string;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");

      if (error) throw error;

      const settings: SiteSettings = {};
      data?.forEach((row: { key: string; value: string }) => {
        settings[row.key] = row.value;
      });
      return settings;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  image_url: string | null;
  rating: number;
  display_order: number;
  is_active: boolean;
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async (): Promise<Testimonial[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
