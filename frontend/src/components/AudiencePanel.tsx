'use client';

/** @file AudiencePanel component — displays and manages the target audience configuration */

import { useState } from 'react';
import type { AudienceCondition } from '../types/campaign';

const inputClass =
  'border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

const FIELD_OPTIONS: AudienceCondition['field'][] = ['country', 'device', 'age_range'];

const fieldBadgeClass: Record<AudienceCondition['field'], string> = {
  country:   'bg-blue-100 text-blue-700',
  device:    'bg-purple-100 text-purple-700',
  age_range: 'bg-orange-100 text-orange-700',
};

type AudiencePanelProps = {
  /** Current list of audience conditions. */
  conditions: AudienceCondition[];
  /** Called when the list changes (add or remove). */
  onChange: (conditions: AudienceCondition[]) => void;
  /** Whether the panel inputs should be disabled. */
  disabled?: boolean;
};

/**
 * Controlled component for managing campaign audience targeting conditions.
 * Supports adding and removing field/value pairs with inline duplicate detection.
 */
export function AudiencePanel({ conditions, onChange, disabled = false }: AudiencePanelProps): React.ReactElement {
  const [draftField, setDraftField] = useState<AudienceCondition['field']>('country');
  const [draftValue, setDraftValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function handleAdd(): void {
    if (!draftValue.trim()) {
      setError('Value cannot be empty');
      return;
    }

    const alreadyExists = conditions.some(
      (c) => c.field === draftField && c.value.toLowerCase() === draftValue.trim().toLowerCase(),
    );

    if (alreadyExists) {
      setError('Condition already added');
      return;
    }

    onChange([...conditions, { field: draftField, value: draftValue.trim() }]);
    setDraftField('country');
    setDraftValue('');
    setError(null);
  }

  function handleRemove(index: number): void {
    onChange(conditions.filter((_, i) => i !== index));
  }

  return (
    <div>
      <p className="font-semibold text-gray-800 mb-3">Audience</p>

      {conditions.length === 0 && (
        <p className="text-gray-400 text-sm mb-3">Add at least one audience condition</p>
      )}

      {conditions.length > 0 && (
        <ul className="mb-3 space-y-2">
          {conditions.map((condition, index) => (
            <li key={index} className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${fieldBadgeClass[condition.field]}`}
              >
                {condition.field}
              </span>
              <span className="text-gray-700 text-sm flex-1">{condition.value}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                aria-label="Remove condition"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <select
          value={draftField}
          onChange={(e) => setDraftField(e.target.value as AudienceCondition['field'])}
          disabled={disabled}
          className={`${inputClass} w-auto`}
        >
          {FIELD_OPTIONS.map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={draftValue}
          onChange={(e) => setDraftValue(e.target.value)}
          disabled={disabled}
          placeholder="e.g. US, mobile, 25-34"
          className={inputClass}
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
