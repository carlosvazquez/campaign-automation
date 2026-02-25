/** @file Campaign routes — Express router defining all /campaigns endpoints */

import { Router, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { campaignRepository } from '../data/campaign-repository';
import { CampaignService } from '../services/campaign-service';
import { CreateCampaignSchema, SimulateInputSchema } from './schemas';

const campaignService = new CampaignService(campaignRepository);

export const campaignRouter: Router = Router();

/** POST /api/campaigns — creates a new campaign from the validated request body. */
const createCampaignHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateCampaignSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  const campaign = await campaignService.createCampaign(parsed.data);
  res.status(201).json({ data: campaign });
};

/** POST /api/campaigns/:id/simulate — evaluates a campaign rule against a live metric input. */
const simulateCampaignHandler: RequestHandler<{ id: string }> = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const parsed = SimulateInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await campaignService.simulateCampaign(req.params.id, parsed.data);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
};

campaignRouter.post('/', createCampaignHandler);
campaignRouter.post('/:id/simulate', simulateCampaignHandler);
