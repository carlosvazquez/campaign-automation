/**
 * @file Frontend domain types for the campaign automation system.
 *
 * Trade-off note: These types are intentionally duplicated from the backend
 * domain layer. Coupling the frontend build to the backend codebase (e.g. via
 * a direct import) would create a tight deployment dependency between two
 * independently deployable units. In a production system the correct approach
 * is a shared types package (e.g. @campaign/types) published to a private
 * registry and consumed by both sides. For this project, duplication is the
 * pragmatic choice.
 */

/** Comparison operators supported by the rule engine. */
export type Operator = '<' | '>' | '=' | '>=' | '<=';

/** Actions the system can take when a rule is triggered. */
export type Action = 'pause' | 'scale_up' | 'alert';

/** A performance rule attached to a campaign. */
export type Rule = {
  metric:   string;
  operator: Operator;
  value:    number;
  action:   Action;
};

/** A single condition filtering a campaign audience. */
export type AudienceCondition = {
  field: 'country' | 'device' | 'age_range';
  value: string;
};

/**
 * Campaign entity as returned by the backend.
 * Note: createdAt is an ISO 8601 string — the backend serializes Date over JSON.
 */
export type Campaign = {
  id:           string;
  name:         string;
  budget:       number;
  /** List of creative asset names or URLs — always present in API responses. */
  creativities: string[];
  audience:     AudienceCondition[];
  rule:         Rule;
  /** ISO 8601 string — backend serializes Date as string over JSON. */
  createdAt:    string;
};

/** Machine-readable outcome code returned by the rule engine. */
export type SimulateResultCode =
  | 'TRIGGERED'
  | 'NOT_TRIGGERED'
  | 'METRIC_MISMATCH';

/** Result of a campaign rule simulation. */
export type SimulateResult = {
  triggered: boolean;
  action:    Action | null;
  code:      SimulateResultCode;
  reason:    string;
};

/** Payload for POST /api/campaigns. */
export type CreateCampaignPayload = {
  name:         string;
  budget:       number;
  /** Required — must contain at least one creative asset name or URL. */
  creativities: string[];
  audience:     AudienceCondition[];
  rule:         Rule;
};

/** Payload for POST /api/campaigns/:id/simulate. */
export type SimulatePayload = {
  metric: string;
  value:  number;
};

/**
 * Form state type mirroring CreateCampaignPayload.
 * budget is a string because HTML number inputs always yield strings before parsing.
 * creativities starts as an empty array and must have at least 1 item before submit.
 */
export type CreateCampaignForm = {
  name:         string;
  /** String because <input type="number"> returns a string before parsing. */
  budget:       string;
  /** Required — validated as min 1 item on submit. */
  creativities: string[];
  audience:     AudienceCondition[];
  rule:         Rule;
  /** Live metric value used in the simulate step — editable independently of the rule threshold. */
  simulateValue: string;
};

/** Generic API success response envelope. */
export type ApiSuccessResponse<T> = { data: T };

/** Generic API error response envelope. */
export type ApiErrorResponse = { error: string; details?: unknown };

/** Union of success and error API response shapes. */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
