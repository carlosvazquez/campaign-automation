/** @file Query client — singleton TanStack Query client instance with default options */

import {
  QueryClient,
  useMutation,
  type UseMutationResult,
} from '@tanstack/react-query';
import { ApiError, createCampaign, simulateCampaign } from './api-client';
import type {
  Campaign,
  CreateCampaignPayload,
  SimulatePayload,
  SimulateResult,
} from '../types/campaign';

/** Singleton QueryClient shared across the entire application. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Retry once on transient failures before surfacing an error to the UI. */
      retry: 1,
      /** Treat data as fresh for 30 s to reduce redundant background fetches. */
      staleTime: 30_000,
      /** Avoid unexpected refetches in a form-heavy UI when the user switches tabs. */
      refetchOnWindowFocus: false,
    },
    mutations: {
      /** Mutations are not idempotent — never auto-retry; let the user decide. */
      retry: 0,
    },
  },
});

/**
 * Centralised query key registry.
 * Defining keys here prevents cache-invalidation bugs caused by
 * key string mismatches scattered across different components.
 */
export const campaignKeys = {
  all:    ['campaigns'] as const,
  detail: (id: string) => ['campaigns', id] as const,
} as const;

/**
 * Mutation hook for creating a new campaign.
 *
 * Delegates to POST /api/campaigns via the api-client layer.
 * Errors are surfaced as ApiError instances — components decide how to display them.
 *
 * @returns UseMutationResult ready to call with a CreateCampaignPayload.
 */
export function useCreateCampaign(): UseMutationResult<
  Campaign,
  ApiError,
  CreateCampaignPayload
> {
  return useMutation<Campaign, ApiError, CreateCampaignPayload>({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
  });
}

/**
 * Mutation hook for simulating a campaign rule against a live metric input.
 *
 * Accepts a single object argument so useMutation receives the canonical
 * single-variable signature.
 *
 * @returns UseMutationResult ready to call with { id, payload }.
 */
export function useSimulateCampaign(): UseMutationResult<
  SimulateResult,
  ApiError,
  { id: string; payload: SimulatePayload }
> {
  return useMutation<SimulateResult, ApiError, { id: string; payload: SimulatePayload }>({
    mutationFn: (vars: { id: string; payload: SimulatePayload }) =>
      simulateCampaign(vars.id, vars.payload),
  });
}
