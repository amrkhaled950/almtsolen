import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPublicSiteSettings, type SiteSettings } from "./site-settings.functions";

export function useSiteSettings() {
  const fetchSettings = useServerFn(getPublicSiteSettings);
  const q = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
    staleTime: 60_000,
  });
  return { settings: (q.data?.settings ?? null) as SiteSettings | null, isLoading: q.isLoading };
}
