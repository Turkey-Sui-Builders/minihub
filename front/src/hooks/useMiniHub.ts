import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { MiniHubSDK, PackageConfig } from '../sdk/minihub-sdk-simple';

/**
 * Hook to initialize MiniHub SDK with environment configuration
 */
export function useMiniHubSDK() {
  const client = useSuiClient();

  const config: PackageConfig = {
    packageId: import.meta.env.VITE_JOB_BOARD_PACKAGE_ID || '',
    jobBoardId: import.meta.env.VITE_JOB_BOARD_OBJECT_ID || '',
    userRegistryId: import.meta.env.VITE_USER_REGISTRY_ID || '',
    employerRegistryId: import.meta.env.VITE_EMPLOYER_REGISTRY_ID || '',
    clockId: '0x6', // Sui Clock object
  };

  return new MiniHubSDK(client, config);
}

/**
 * Hook to fetch all active jobs from the blockchain
 */
export function useActiveJobs() {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['active-jobs'],
    queryFn: async () => {
      return await sdk.getActiveJobs();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  });
}

/**
 * Hook to fetch all jobs (including inactive)
 */
export function useAllJobs() {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['all-jobs'],
    queryFn: async () => {
      return await sdk.getAllJobs();
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

/**
 * Hook to fetch a specific job by ID
 */
export function useJob(jobId: string | null) {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      return await sdk.getJob(jobId);
    },
    enabled: !!jobId,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

/**
 * Hook to fetch jobs by employer address
 */
export function useEmployerJobs(employerAddress: string | null) {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['employer-jobs', employerAddress],
    queryFn: async () => {
      if (!employerAddress) return [];
      return await sdk.getJobsByEmployer(employerAddress);
    },
    enabled: !!employerAddress,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

/**
 * Hook to fetch user profile
 */
export function useUserProfile(profileId: string | null) {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['user-profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      return await sdk.getUserProfile(profileId);
    },
    enabled: !!profileId,
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

/**
 * Hook to fetch employer profile
 */
export function useEmployerProfile(profileId: string | null) {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['employer-profile', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      return await sdk.getEmployerProfile(profileId);
    },
    enabled: !!profileId,
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

/**
 * Hook to get JobBoard stats
 */
export function useJobBoardStats() {
  const sdk = useMiniHubSDK();

  return useQuery({
    queryKey: ['jobboard-stats'],
    queryFn: async () => {
      return await sdk.getJobBoard();
    },
    refetchInterval: 30000,
    staleTime: 20000,
  });
}
