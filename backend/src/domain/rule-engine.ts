/** @file Rule engine — pure evaluation of campaign performance rules against live metric inputs */

import { type Rule, type SimulateInput, type SimulateResult } from './types';

/**
 * Evaluates a campaign performance rule against a live metric input.
 *
 * The function is pure: it has no side effects, does not mutate its arguments,
 * and always returns a {@link SimulateResult} — it never throws.
 *
 * @param rule  - The performance rule to evaluate, as stored on a Campaign.
 * @param input - The live metric reading to test against the rule.
 * @returns A SimulateResult describing whether the rule triggered and why.
 */
export function evaluateRule(rule: Rule, input: SimulateInput): SimulateResult {
  if (input.metric.toLowerCase() !== rule.metric.toLowerCase()) {
    return {
      triggered: false,
      action: null,
      reason: `Metric mismatch: rule watches '${rule.metric}', got '${input.metric}'`,
    };
  }

  const { metric, operator, value: threshold, action } = rule;
  const { value } = input;

  let triggered: boolean;

  switch (operator) {
    case '<':
      triggered = value < threshold;
      break;
    case '>':
      triggered = value > threshold;
      break;
    case '=':
      triggered = value === threshold;
      break;
    case '>=':
      triggered = value >= threshold;
      break;
    case '<=':
      triggered = value <= threshold;
      break;
    default: {
      const exhaustive: never = operator;
      return {
        triggered: false,
        action: null,
        reason: `Unknown operator: ${exhaustive}`,
      };
    }
  }

  if (triggered) {
    return {
      triggered: true,
      action,
      reason: `${metric} ${value} ${operator} ${threshold} — rule triggered, action: ${action}`,
    };
  }

  return {
    triggered: false,
    action: null,
    reason: `${metric} ${value} is not ${operator} ${threshold} — rule not triggered`,
  };
}
