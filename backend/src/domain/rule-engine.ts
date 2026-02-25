/** @file Rule engine — pure evaluation of campaign performance rules against live metric inputs */

import type { Rule, RuleOperator, SimulateInput, SimulateResult, SimulateResultCode } from './types';

type OperatorFn = (left: number, right: number) => boolean;

const OPERATOR_MAP: Record<RuleOperator, OperatorFn> = {
  '<': (left, right) => left < right,
  '>': (left, right) => left > right,
  '=': (left, right) => left === right,
  '>=': (left, right) => left >= right,
  '<=': (left, right) => left <= right,
};

function normalizeMetric(metric: string): string {
  return metric.trim().toLowerCase();
}

function metricsMatch(ruleMetric: string, inputMetric: string): boolean {
  return normalizeMetric(ruleMetric) === normalizeMetric(inputMetric);
}

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

function evaluateOperator(
  operator: RuleOperator,
  inputValue: number,
  threshold: number
): boolean {
  const comparator = OPERATOR_MAP[operator];

  if (!comparator) {
    return assertNever(operator);
  }

  return comparator(inputValue, threshold);
}

function formatReason(
  code: SimulateResultCode,
  context: {
    ruleMetric: string;
    inputMetric: string;
    inputValue: number;
    operator: RuleOperator;
    threshold: number;
    action: string;
  }
): string {
  const { ruleMetric, inputMetric, inputValue, operator, threshold, action } = context;

  switch (code) {
    case 'METRIC_MISMATCH':
      return `Metric mismatch: rule watches '${ruleMetric}', got '${inputMetric}'`;

    case 'TRIGGERED':
      return `${ruleMetric} ${inputValue} ${operator} ${threshold} — rule triggered, action: ${action}`;

    case 'NOT_TRIGGERED':
      return `${ruleMetric} ${inputValue} is not ${operator} ${threshold} — rule not triggered`;

    default:
      return assertNever(code);
  }
}

function buildResult(
  code: SimulateResultCode,
  rule: Rule,
  input: SimulateInput
): SimulateResult {
  const triggered = code === 'TRIGGERED';

  return {
    triggered,
    action: triggered ? rule.action : null,
    code,
    reason: formatReason(code, {
      ruleMetric: rule.metric,
      inputMetric: input.metric,
      inputValue: input.value,
      operator: rule.operator,
      threshold: rule.value,
      action: rule.action,
    }),
  };
}

function validateRuleApplicability(rule: Rule, input: SimulateInput): SimulateResultCode | null {
  if (!metricsMatch(rule.metric, input.metric)) {
    return 'METRIC_MISMATCH';
  }

  return null;
}

function determineEvaluationCode(rule: Rule, input: SimulateInput): SimulateResultCode {
  const isTriggered = evaluateOperator(rule.operator, input.value, rule.value);
  return isTriggered ? 'TRIGGERED' : 'NOT_TRIGGERED';
}

/**
 * Evaluates a campaign performance rule against a live metric input.
 *
 * Pure function — no side effects, never throws.
 *
 * @param rule  - The performance rule to evaluate, as stored on a Campaign.
 * @param input - The live metric reading to test against the rule.
 * @returns A SimulateResult describing whether the rule triggered and why.
 */
export function evaluateRule(rule: Rule, input: SimulateInput): SimulateResult {
  const validationError = validateRuleApplicability(rule, input);

  if (validationError) {
    return buildResult(validationError, rule, input);
  }

  const evaluationCode = determineEvaluationCode(rule, input);
  return buildResult(evaluationCode, rule, input);
}
