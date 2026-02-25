/** @file Domain types — all shared data shapes and repository contracts for the campaign system */

/**
 * Comparison operators supported by the rule engine.
 * Used to compare a live metric value against a threshold defined in a Rule.
 */
export type Operator = '<' | '>' | '=' | '>=' | '<=';

/**
 * Actions the system can take when a rule condition is triggered.
 * - pause:    Stop the campaign immediately.
 * - scale_up: Increase budget or bids for the campaign.
 * - alert:    Notify the operator without changing campaign state.
 */
export type Action = 'pause' | 'scale_up' | 'alert';

/**
 * A performance rule that encodes: IF metric operator value THEN action.
 * Rules are evaluated by the rule engine against live metric inputs.
 */
export type Rule = {
  /** The metric name to watch, e.g. 'ROAS', 'CPC', 'CTR', 'CPA'. */
  metric: string;
  /** The comparison operator applied between the live value and the threshold. */
  operator: Operator;
  /** The threshold value the live metric is compared against. */
  value: number;
  /** The action to execute when the condition evaluates to true. */
  action: Action;
};

/**
 * A single condition that filters a campaign's target audience.
 * Multiple conditions are combined with an implicit AND in the audience array.
 */
export type AudienceCondition = {
  /** The audience dimension to filter on. */
  field: 'country' | 'device' | 'age_range';
  /** The value to match for the chosen field, e.g. 'US', 'mobile', '25-34'. */
  value: string;
};

/**
 * Core campaign entity representing a fully configured marketing campaign.
 * This is the central aggregate of the domain model.
 */
export type Campaign = {
  /** Unique identifier (UUID) assigned at creation time. */
  id: string;
  /** Human-readable campaign name. */
  name: string;
  /** Total budget allocated to this campaign in the account's base currency. */
  budget: number;
  /**
   * List of creative asset names or URLs associated with this campaign.
   * Required by the domain spec — must contain at least one item.
   * Never make this field optional or omit it in any layer.
   */
  creativities: string[];
  /** Audience targeting conditions; all conditions must be satisfied (AND logic). */
  audience: AudienceCondition[];
  /** The performance rule governing automated actions for this campaign. */
  rule: Rule;
  /** Timestamp when the campaign was first persisted. */
  createdAt: Date;
};

/**
 * Input payload for the simulate endpoint.
 * Represents a single live metric reading to evaluate against a campaign rule.
 */
export type SimulateInput = {
  /** The name of the metric being reported, e.g. 'ROAS', 'CPC'. */
  metric: string;
  /** The live numeric value of the metric. */
  value: number;
};

/**
 * Result returned by the rule engine after evaluating a rule against an input.
 */
export type SimulateResult = {
  /** Whether the rule condition evaluated to true. */
  triggered: boolean;
  /** The action to execute, or null when the rule was not triggered. */
  action: Action | null;
  /** Human-readable explanation of the evaluation outcome. */
  reason: string;
};

/**
 * Repository contract for Campaign persistence.
 * Defined in the domain layer and implemented in the data layer to satisfy
 * the Dependency Inversion Principle — the domain depends on nothing outward.
 */
export interface ICampaignRepository {
  /** Persist a new campaign and return the saved entity. */
  save(campaign: Campaign): Promise<Campaign>;
  /** Retrieve a campaign by its unique identifier, or null if not found. */
  findById(id: string): Promise<Campaign | null>;
  /** Retrieve all persisted campaigns. */
  findAll(): Promise<Campaign[]>;
}
