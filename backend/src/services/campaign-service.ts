/** @file Campaign service — orchestrates business logic between repository and rule engine */

import { v4 as uuidv4 } from 'uuid';
import { evaluateRule } from '../domain/rule-engine';
import type { Campaign, ICampaignRepository, SimulateResult } from '../domain/types';
import type { CreateCampaignDto, SimulateInputDto } from '../routes/schemas';

/**
 * Thrown by {@link CampaignService} when a requested campaign ID does not exist
 * in the repository. The route layer maps this to a 404 HTTP response.
 */
export class CampaignNotFoundError extends Error {
  constructor(id: string) {
    super(`Campaign with id "${id}" was not found`);
    this.name = 'CampaignNotFoundError';
  }
}

/**
 * Orchestrates campaign creation and rule simulation.
 *
 * Receives its repository dependency via constructor injection so it can be
 * tested in isolation without touching the real in-memory store.
 */
export class CampaignService {
  constructor(private readonly repository: ICampaignRepository) {}

  /**
   * Creates a new campaign from the validated DTO and persists it.
   *
   * @param dto - Validated request payload from the route layer.
   * @returns The persisted Campaign entity including its generated ID.
   */
  async createCampaign(dto: CreateCampaignDto): Promise<Campaign> {
    const campaign: Campaign = {
      id:           uuidv4(),
      createdAt:    new Date(),
      name:         dto.name,
      budget:       dto.budget,
      creativities: dto.creativities,
      audience:     dto.audience,
      rule:         dto.rule,
    };

    return this.repository.save(campaign);
  }

  /**
   * Evaluates a campaign's performance rule against the provided metric input.
   *
   * @param id    - The UUID of the campaign whose rule to evaluate.
   * @param input - The live metric reading to test.
   * @returns A SimulateResult describing whether the rule triggered and why.
   * @throws {CampaignNotFoundError} When no campaign with the given ID exists.
   */
  async simulateCampaign(id: string, input: SimulateInputDto): Promise<SimulateResult> {
    const campaign = await this.repository.findById(id);

    if (campaign === null) {
      throw new CampaignNotFoundError(id);
    }

    return evaluateRule(campaign.rule, input);
  }
}
