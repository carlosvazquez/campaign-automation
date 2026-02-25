'use client';

/** @file SimulateResult component — displays the outcome of a campaign simulation run */

import type { SimulateResult as SimulateResultType } from '../types/campaign';

type SimulateResultProps = {
  /** Simulation result from the backend, null if not yet simulated. */
  result: SimulateResultType | null;
  /** Whether the simulation is currently in progress. */
  isLoading: boolean;
  /** API error message if the simulation failed. */
  error: string | null;
};

/**
 * Pure display component that renders one of five simulation states:
 * loading, error, triggered, not-triggered, or idle (null).
 */
export function SimulateResult({ result, isLoading, error }: SimulateResultProps): React.ReactElement | null {
  // STATE 1: Loading
  if (isLoading) {
    return (
      <div className="p-4 rounded border border-gray-100 mt-4">
        <div className="animate-pulse space-y-2">
          <div className="bg-gray-200 rounded h-4 w-3/4" />
          <div className="bg-gray-200 rounded h-4 w-1/2" />
        </div>
      </div>
    );
  }

  // STATE 2: Error
  if (error !== null) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
        <p className="text-red-700 font-semibold">✕ {error}</p>
        <p className="text-red-500 text-sm mt-1">Check the campaign ID or try again</p>
      </div>
    );
  }

  // STATE 3: Triggered
  if (result !== null && result.triggered) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 mt-4">
        <p className="text-red-700 font-semibold mb-1">Rule Triggered</p>
        <p className="text-red-700 text-sm">
          Action taken: <span className="font-mono">{result.action}</span>
        </p>
        <p className="text-red-600 text-sm mt-1">{result.reason}</p>
      </div>
    );
  }

  // STATE 4: Not triggered
  if (result !== null && !result.triggered) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4 mt-4">
        <p className="text-green-700 font-semibold mb-1">Rule Not Triggered</p>
        <p className="text-green-600 text-sm">{result.reason}</p>
      </div>
    );
  }

  // STATE 5: Idle
  return null;
}
