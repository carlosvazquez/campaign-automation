/** @file Campaign repository — in-memory CRUD operations for campaign records */

import type { Campaign, ICampaignRepository } from '../domain/types';

/** Hardcoded IDs for the three seeded mock campaigns — stable across restarts for predictable test references. */
export const MOCK_CAMPAIGN_IDS = {
  roasAlert: 'a1b2c3d4-0001-4000-8000-000000000001',
  cpcAlert:  'a1b2c3d4-0002-4000-8000-000000000002',
  ctrScale:  'a1b2c3d4-0003-4000-8000-000000000003',
} as const;

/**
 * In-memory implementation of {@link ICampaignRepository}.
 *
 * Campaigns are stored in a private Map keyed by campaign ID.
 * All methods return Promises to keep the contract swappable for a real
 * database implementation without changing any consumer code.
 */
export class CampaignRepository implements ICampaignRepository {
  private readonly store = new Map<string, Campaign>();

  constructor() {
    this.seedMockData();
  }

  /**
   * Upserts a campaign into the store.
   * Inserts a new record if the ID is not present; overwrites the existing
   * record if it is.
   *
   * @param campaign - The campaign to persist.
   * @returns The saved campaign.
   */
  save(campaign: Campaign): Promise<Campaign> {
    this.store.set(campaign.id, campaign);
    return Promise.resolve(campaign);
  }

  /**
   * Retrieves a campaign by its unique identifier.
   *
   * Returns a shallow copy to prevent external mutation of the stored record.
   *
   * @param id - The UUID of the campaign to retrieve.
   * @returns The matching campaign, or null if not found.
   */
  findById(id: string): Promise<Campaign | null> {
    const campaign = this.store.get(id);
    return Promise.resolve(campaign ? { ...campaign } : null);
  }

  /**
   * Retrieves all persisted campaigns as a new array.
   *
   * @returns An array containing all stored campaigns.
   */
  findAll(): Promise<Campaign[]> {
    return Promise.resolve([...this.store.values()]);
  }

  /**
   * Seeds the store with three deterministic mock campaigns covering distinct
   * rule evaluation scenarios used by integration tests.
   */
  private seedMockData(): void {
    const campaigns: Campaign[] = [
      {
        id: MOCK_CAMPAIGN_IDS.roasAlert,
        name: 'Black Friday EMEA',
        budget: 25000,
        creativities: ['banner-black-friday.png', 'video-30s-emea.mp4'],
        audience: [
          { field: 'country', value: 'DE' },
          { field: 'device',  value: 'mobile' },
        ],
        rule: { metric: 'ROAS', operator: '<', value: 3, action: 'pause' },
        createdAt: new Date('2025-01-10T08:00:00.000Z'),
      },
      {
        id: MOCK_CAMPAIGN_IDS.cpcAlert,
        name: 'Brand Awareness Q1',
        budget: 12000,
        creativities: ['display-brand-v1.png', 'carousel-brand.jpg'],
        audience: [
          { field: 'country',   value: 'US' },
          { field: 'age_range', value: '25-34' },
        ],
        rule: { metric: 'CPC', operator: '>', value: 5, action: 'alert' },
        createdAt: new Date('2025-02-01T09:00:00.000Z'),
      },
      {
        id: MOCK_CAMPAIGN_IDS.ctrScale,
        name: 'Summer Retargeting EU',
        budget: 8500,
        creativities: ['retargeting-summer-v2.png', 'story-15s-summer.mp4'],
        audience: [
          { field: 'country', value: 'FR' },
          { field: 'device',  value: 'desktop' },
        ],
        rule: { metric: 'CTR', operator: '>=', value: 10, action: 'scale_up' },
        createdAt: new Date('2025-03-15T11:00:00.000Z'),
      },
    ];

    for (const campaign of campaigns) {
      this.store.set(campaign.id, campaign);
    }
  }
}

/**
 * Shared singleton instance of {@link CampaignRepository}.
 *
 * The in-memory store must be shared across all requests for the lifetime of
 * the process. A single instance guarantees all layers read from and write to
 * the same Map.
 */
export const campaignRepository = new CampaignRepository();
