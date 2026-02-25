/** @file Integration tests for the simulate campaign endpoint using supertest */

import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { MOCK_CAMPAIGN_IDS } from '../../data/campaign-repository';

describe('POST /api/campaigns/:id/simulate', () => {
  describe('when campaign exists and rule triggers', () => {
    it('should return 200 with triggered: true and the rule action', async (): Promise<void> => {
      // Mock campaign 1: ROAS < 3 — triggers with value 2
      const res = await request(app)
        .post(`/api/campaigns/${MOCK_CAMPAIGN_IDS.roasAlert}/simulate`)
        .send({ metric: 'ROAS', value: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.triggered).toBe(true);
      expect(res.body.data.action).toBe('pause');
      expect(res.body.data.code).toBe('TRIGGERED');
      expect(typeof res.body.data.reason).toBe('string');
    });
  });

  describe('when campaign exists and rule does not trigger', () => {
    it('should return 200 with triggered: false and action: null', async (): Promise<void> => {
      // Mock campaign 2: CPC > 5 — does not trigger with value 3
      const res = await request(app)
        .post(`/api/campaigns/${MOCK_CAMPAIGN_IDS.cpcAlert}/simulate`)
        .send({ metric: 'CPC', value: 3 });

      expect(res.status).toBe(200);
      expect(res.body.data.triggered).toBe(false);
      expect(res.body.data.action).toBeNull();
      expect(res.body.data.code).toBe('NOT_TRIGGERED');
      expect(typeof res.body.data.reason).toBe('string');
    });
  });

  describe('when campaign does not exist', () => {
    it('should return 404 with an error message', async (): Promise<void> => {
      const res = await request(app)
        .post('/api/campaigns/00000000-0000-0000-0000-000000000000/simulate')
        .send({ metric: 'ROAS', value: 2 });

      expect(res.status).toBe(404);
      expect(typeof res.body.error).toBe('string');
      expect(res.body.error).toContain('00000000-0000-0000-0000-000000000000');
    });
  });

  describe('when request body is invalid', () => {
    it('should return 400 with validation error details', async (): Promise<void> => {
      // Missing required metric field
      const res = await request(app)
        .post(`/api/campaigns/${MOCK_CAMPAIGN_IDS.roasAlert}/simulate`)
        .send({ value: 2 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
      expect(res.body.details).toBeDefined();
    });
  });
});
