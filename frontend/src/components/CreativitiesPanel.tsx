'use client';

/** @file CreativitiesPanel component — manages the creativities field for campaign creatives */

import { useState } from 'react';

const inputClass =
  'border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

type CreativitiesPanelProps = {
  /** Current list of creative asset names or URLs. */
  creativities: string[];
  /** Called when the list changes (add or remove). */
  onChange: (creativities: string[]) => void;
  /** Whether the panel inputs should be disabled. */
  disabled?: boolean;
};

/**
 * Controlled component for managing the list of campaign creative assets.
 * Required by the challenge spec — creativities must never be omitted.
 * Supports adding and removing creative names or URLs with duplicate detection.
 */
export function CreativitiesPanel({ creativities, onChange, disabled = false }: CreativitiesPanelProps): React.ReactElement {
  const [draftValue, setDraftValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function handleAdd(): void {
    if (!draftValue.trim()) {
      setError('Creative name cannot be empty');
      return;
    }

    const alreadyExists = creativities.some(
      (c) => c.toLowerCase() === draftValue.trim().toLowerCase(),
    );

    if (alreadyExists) {
      setError('This creative is already added');
      return;
    }

    onChange([...creativities, draftValue.trim()]);
    setDraftValue('');
    setError(null);
  }

  function handleRemove(index: number): void {
    onChange(creativities.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="font-semibold text-gray-800 mb-3">Creativities</p>

      {creativities.length === 0 && (
        <p className="text-gray-400 text-sm mb-3">Add at least one creative (name or URL)</p>
      )}

      {creativities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {creativities.map((creative, index) => (
            <span
              key={index}
              className="flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm max-w-xs"
            >
              <span className="truncate">{creative}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold leading-none"
                aria-label="Remove creative"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          disabled={disabled}
          placeholder="e.g. banner-v1.png or https://cdn.example.com/ad.mp4"
          className={`${inputClass} flex-1`}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !draftValue.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Add
        </button>
      </div>

      {error !== null && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
