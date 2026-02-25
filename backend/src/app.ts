/** @file Express application factory — registers middleware and routes */

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { campaignRouter } from './routes/campaign-routes';
import { CampaignNotFoundError } from './services/campaign-service';

export const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use('/api/campaigns', campaignRouter);

/** Global error handler — must be registered last and must declare all four parameters. */
app.use((err: Error, req: Request, res: Response, _next: NextFunction): void => {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.flatten() });
    return;
  }

  if (err instanceof CampaignNotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
});
