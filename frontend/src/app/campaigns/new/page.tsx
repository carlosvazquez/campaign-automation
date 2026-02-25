'use client';

/** @file New campaign page — renders the campaign creation and simulation form */

import { useState } from 'react';
import { AudiencePanel } from '../../../components/AudiencePanel';
import { CreativitiesPanel } from '../../../components/CreativitiesPanel';
import { RuleBuilder } from '../../../components/RuleBuilder';
import { SimulateResult } from '../../../components/SimulateResult';
import { useCreateCampaign, useSimulateCampaign } from '../../../lib/query-client';
import { ApiError } from '../../../lib/api-client';
import type { CreateCampaignForm } from '../../../types/campaign';

const inputClass =
  'border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed';

const DEFAULT_FORM: CreateCampaignForm = {
  name:          '',
  budget:        '',
  creativities:  [],
  audience:      [],
  rule:          { metric: 'ROAS', operator: '<', value: 3, action: 'pause' },
  simulateValue: String(3),
};

/**
 * Campaign creation page.
 * Manages all form state and orchestrates the two-step create → simulate flow.
 */
export default function NewCampaignPage(): React.ReactElement {
  const [form, setForm] = useState<CreateCampaignForm>(DEFAULT_FORM);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createCampaign = useCreateCampaign();
  const simulateCampaign = useSimulateCampaign();

  const isSubmitting: boolean = createCampaign.isPending || simulateCampaign.isPending;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setFormError(null);

    // Step 1 — Local validation
    if (form.name.trim().length < 3) {
      setFormError('Campaign name must be at least 3 characters');
      return;
    }

    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget <= 0) {
      setFormError('Budget must be a positive number');
      return;
    }

    if (form.creativities.length === 0) {
      setFormError('Add at least one creative');
      return;
    }

    if (form.audience.length === 0) {
      setFormError('Add at least one audience condition');
      return;
    }

    if (form.rule.value <= 0) {
      setFormError('Rule value must be a positive number');
      return;
    }

    const simulateValue = parseFloat(form.simulateValue);
    if (isNaN(simulateValue) || simulateValue <= 0) {
      setFormError('Simulate value must be a positive number');
      return;
    }

    try {
      // Step 2 — Create campaign
      const campaign = await createCampaign.mutateAsync({
        name:         form.name.trim(),
        budget,
        creativities: form.creativities,
        audience:     form.audience,
        rule:         form.rule,
      });

      setCreatedCampaignId(campaign.id);

      // Step 3 — Simulate
      await simulateCampaign.mutateAsync({
        id:      campaign.id,
        payload: { metric: form.rule.metric, value: simulateValue },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('An unexpected error occurred');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">New Campaign</h1>

        <form onSubmit={handleSubmit}>
          {/* Section 1 — Campaign Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="name">
                Campaign name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={isSubmitting}
                placeholder="e.g. Black Friday EMEA"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="budget">
                Budget ($)
              </label>
              <input
                id="budget"
                type="number"
                min={1}
                step={0.01}
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                disabled={isSubmitting}
                placeholder="e.g. 5000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Section 2 — Creativities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <CreativitiesPanel
              creativities={form.creativities}
              onChange={(creativities) => setForm({ ...form, creativities })}
              disabled={isSubmitting}
            />
          </div>

          {/* Section 3 — Audience */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <AudiencePanel
              conditions={form.audience}
              onChange={(audience) => setForm({ ...form, audience })}
              disabled={isSubmitting}
            />
          </div>

          {/* Section 4 — Performance Rule */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <RuleBuilder
              rule={form.rule}
              onChange={(rule) => setForm({ ...form, rule, simulateValue: String(rule.value) })}
              disabled={isSubmitting}
            />
          </div>

          {/* Section 5 — Simulate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="simulateValue">
                Simulate with value
              </label>
              <input
                id="simulateValue"
                type="number"
                step="any"
                value={form.simulateValue}
                onChange={(e) => setForm({ ...form, simulateValue: e.target.value })}
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            {formError !== null && (
              <div className="bg-red-50 text-red-700 rounded p-3 mb-4 text-sm">
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Simulating...' : 'Simulate'}
            </button>

            <SimulateResult
              result={simulateCampaign.data ?? null}
              isLoading={simulateCampaign.isPending}
              error={simulateCampaign.error?.message ?? null}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
