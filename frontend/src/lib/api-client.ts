/** @file API client — configured axios instance for communicating with the backend */

import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type {
  Campaign,
  CreateCampaignPayload,
  SimulatePayload,
  SimulateResult,
} from '../types/campaign';

/**
 * Normalized HTTP error thrown by the response interceptor.
 * Status 0 indicates a network-level failure (no response received).
 */
export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Internal axios instance.
 * baseURL is read from NEXT_PUBLIC_API_URL at runtime so the frontend can
 * target different backend environments without a rebuild.
 */
const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Unwraps { data: T } success envelopes and normalises errors to ApiError.
 *
 * The double cast (as unknown as AxiosResponse) is intentional: the interceptor
 * replaces the full AxiosResponse with the inner payload, which axios's type
 * system cannot express without it.
 */
http.interceptors.response.use(
  (response: AxiosResponse<{ data: unknown }>): AxiosResponse =>
    response.data.data as unknown as AxiosResponse,
  (error: AxiosError<{ error: string; details?: unknown }>): never => {
    if (error.response) {
      throw new ApiError(
        error.response.data.error,
        error.response.status,
        error.response.data.details,
      );
    }

    throw new ApiError('Network error — check your connection', 0);
  },
);

/**
 * Creates a new campaign via POST /api/campaigns.
 *
 * @param payload - Campaign creation data including the required creativities array.
 * @returns The created Campaign object with all fields including creativities.
 * @throws {ApiError} On validation failure (400) or server error (500).
 */
export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  return http.post('/api/campaigns', payload) as Promise<Campaign>;
}

/**
 * Simulates a campaign rule via POST /api/campaigns/:id/simulate.
 *
 * @param id      - UUID of the campaign whose rule to evaluate.
 * @param payload - Metric name and live value to test against the rule.
 * @returns The simulation result indicating whether the rule triggered.
 * @throws {ApiError} With status 404 if the campaign is not found.
 */
export async function simulateCampaign(
  id: string,
  payload: SimulatePayload,
): Promise<SimulateResult> {
  return http.post(`/api/campaigns/${id}/simulate`, payload) as Promise<SimulateResult>;
}
