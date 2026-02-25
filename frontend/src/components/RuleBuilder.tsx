'use client';

/** @file RuleBuilder component — interactive UI for composing campaign performance rules */

import type { Action, Operator, Rule } from '../types/campaign';

const inputClass =
  'border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

const METRIC_OPTIONS: string[] = ['ROAS', 'CPC', 'CTR', 'CPA'];

const OPERATOR_OPTIONS: { value: Operator; label: string }[] = [
  { value: '<',  label: 'Less than (<)' },
  { value: '>',  label: 'Greater than (>)' },
  { value: '=',  label: 'Equal to (=)' },
  { value: '>=', label: 'Greater or equal (>=)' },
  { value: '<=', label: 'Less or equal (<=)' },
];

const ACTION_OPTIONS: { value: Action; label: string }[] = [
  { value: 'pause',    label: 'Pause campaign' },
  { value: 'scale_up', label: 'Scale up' },
  { value: 'alert',    label: 'Send alert' },
];

type RuleBuilderProps = {
  /** Current rule state. */
  rule: Rule;
  /** Called on any field change. */
  onChange: (rule: Rule) => void;
  /** Whether the inputs should be disabled. */
  disabled?: boolean;
};

/**
 * Fully controlled component for defining a campaign performance rule.
 * Renders a live preview sentence and a responsive four-field grid.
 */
export function RuleBuilder({ rule, onChange, disabled = false }: RuleBuilderProps): React.ReactElement {
  return (
    <div>
      <p className="font-semibold text-gray-800 mb-3">Performance Rule</p>

      <div className="bg-gray-50 rounded p-3 mb-4">
        <p className="font-mono text-sm text-gray-700">
          IF {rule.metric} {rule.operator} {rule.value} THEN {rule.action}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Metric</label>
          <select
            value={rule.metric}
            onChange={(e) => onChange({ ...rule, metric: e.target.value })}
            disabled={disabled}
            className={inputClass}
          >
            {METRIC_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Operator</label>
          <select
            value={rule.operator}
            onChange={(e) => onChange({ ...rule, operator: e.target.value as Operator })}
            disabled={disabled}
            className={inputClass}
          >
            {OPERATOR_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Value</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={rule.value}
            onChange={(e) => onChange({ ...rule, value: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Action</label>
          <select
            value={rule.action}
            onChange={(e) => onChange({ ...rule, action: e.target.value as Action })}
            disabled={disabled}
            className={inputClass}
          >
            {ACTION_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
