/** @file Unit tests for the rule engine domain logic */

import { describe, it, expect } from 'vitest';
import { evaluateRule } from '../../domain/rule-engine';
import { type Rule, type SimulateInput, type SimulateResult } from '../../domain/types';

const baseRule = (overrides: Partial<Rule> = {}): Rule => ({
  metric: 'ROAS',
  operator: '<',
  value: 3,
  action: 'pause',
  ...overrides,
});

const baseInput = (overrides: Partial<SimulateInput> = {}): SimulateInput => ({
  metric: 'ROAS',
  value: 2,
  ...overrides,
});

describe('evaluateRule', () => {
  describe('operator: <', () => {
    it('should trigger when ROAS 2 is less than threshold 3', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3, action: 'pause' }),
        baseInput({ value: 2 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'pause',
        reason: 'ROAS 2 < 3 — rule triggered, action: pause',
      });
    });

    it('should not trigger when ROAS 3 equals threshold 3', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3 }),
        baseInput({ value: 3 }),
      );
      expect(result).toEqual({
        triggered: false,
        action: null,
        reason: 'ROAS 3 is not < 3 — rule not triggered',
      });
    });

    it('should not trigger when ROAS 5 is above threshold 3', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3 }),
        baseInput({ value: 5 }),
      );
      expect(result).toEqual({
        triggered: false,
        action: null,
        reason: 'ROAS 5 is not < 3 — rule not triggered',
      });
    });
  });

  describe('operator: >', () => {
    it('should trigger when CPC 5 is above threshold 3', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CPC', operator: '>', value: 3, action: 'alert' }),
        baseInput({ metric: 'CPC', value: 5 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'alert',
        reason: 'CPC 5 > 3 — rule triggered, action: alert',
      });
    });

    it('should not trigger when CPC 3 equals threshold 3', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CPC', operator: '>', value: 3, action: 'alert' }),
        baseInput({ metric: 'CPC', value: 3 }),
      );
      expect(result).toEqual({
        triggered: false,
        action: null,
        reason: 'CPC 3 is not > 3 — rule not triggered',
      });
    });
  });

  describe('operator: =', () => {
    it('should trigger when CTR 0.05 exactly equals threshold 0.05', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CTR', operator: '=', value: 0.05, action: 'scale_up' }),
        baseInput({ metric: 'CTR', value: 0.05 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'scale_up',
        reason: 'CTR 0.05 = 0.05 — rule triggered, action: scale_up',
      });
    });

    it('should not trigger when CTR 0.04 differs from threshold 0.05 by any amount', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CTR', operator: '=', value: 0.05, action: 'scale_up' }),
        baseInput({ metric: 'CTR', value: 0.04 }),
      );
      expect(result).toEqual({
        triggered: false,
        action: null,
        reason: 'CTR 0.04 is not = 0.05 — rule not triggered',
      });
    });
  });

  describe('operator: >=', () => {
    it('should trigger when CPA 10 equals threshold 10 (boundary)', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CPA', operator: '>=', value: 10, action: 'alert' }),
        baseInput({ metric: 'CPA', value: 10 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'alert',
        reason: 'CPA 10 >= 10 — rule triggered, action: alert',
      });
    });

    it('should trigger when CPA 15 is above threshold 10', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'CPA', operator: '>=', value: 10, action: 'alert' }),
        baseInput({ metric: 'CPA', value: 15 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'alert',
        reason: 'CPA 15 >= 10 — rule triggered, action: alert',
      });
    });
  });

  describe('operator: <=', () => {
    it('should trigger when ROAS 3 equals threshold 3 (boundary)', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<=', value: 3, action: 'pause' }),
        baseInput({ value: 3 }),
      );
      expect(result).toEqual({
        triggered: true,
        action: 'pause',
        reason: 'ROAS 3 <= 3 — rule triggered, action: pause',
      });
    });
  });

  describe('metric handling', () => {
    it('should be case-insensitive when comparing metric names', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'roas', operator: '<', value: 3 }),
        baseInput({ metric: 'ROAS', value: 2 }),
      );
      expect(result.triggered).toBe(true);
    });

    it('should return triggered: false with reason when metrics do not match', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ metric: 'ROAS' }),
        baseInput({ metric: 'CPC' }),
      );
      expect(result).toEqual({
        triggered: false,
        action: null,
        reason: "Metric mismatch: rule watches 'ROAS', got 'CPC'",
      });
    });
  });

  describe('result shape', () => {
    it('should always return action: null when rule is not triggered', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3 }),
        baseInput({ value: 5 }),
      );
      expect(result.action).toBeNull();
    });

    it('should return the rule action when triggered', () => {
      const result: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3, action: 'scale_up' }),
        baseInput({ value: 1 }),
      );
      expect(result.action).toBe('scale_up');
    });

    it('should always include a non-empty reason string', () => {
      const triggered: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3 }),
        baseInput({ value: 1 }),
      );
      const notTriggered: SimulateResult = evaluateRule(
        baseRule({ operator: '<', value: 3 }),
        baseInput({ value: 5 }),
      );
      expect(triggered.reason.length).toBeGreaterThan(0);
      expect(notTriggered.reason.length).toBeGreaterThan(0);
    });
  });
});
