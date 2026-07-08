import { createJob, getJob, updateJob } from './jobQueueService.js';
import { getProviderSetup } from './providerCatalogService.js';

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function buildWorkerRequest(setup, input = {}) {
  return {
    ...setup.workerManifest.sampleRequest,
    ...input,
    providerId: setup.providerId,
    category: setup.workerManifest.category,
    dryRun: true
  };
}

function readinessResult(setup) {
  const pending = setup.checklist.filter(item => !item.done);
  const missingEnv = setup.env.filter(item => !item.configured).map(item => item.key);
  const reviewBlocked = setup.readiness === 'review-required';

  return {
    dryRun: true,
    runnable: pending.length === 0 && !reviewBlocked,
    providerStatus: setup.readiness,
    pendingChecklist: pending,
    missingEnv,
    reviewBlocked,
    message: reviewBlocked
      ? 'Dry-run created. License/model review is required before enabling execution.'
      : pending.length
        ? 'Dry-run created. Complete pending checklist items before enabling execution.'
        : 'Dry-run ready. Provider can be connected to a real worker process.'
  };
}

export function createProviderWorkerJob(ownerId, providerId, input = {}) {
  const bundle = getProviderSetup(providerId);
  if (!bundle) throw new Error('Provider not found.');

  const { provider, setup } = bundle;
  const request = buildWorkerRequest(setup, input.request || {});
  const readiness = readinessResult(setup);
  const title = cleanText(input.title, `${provider.name} worker dry run`);
  const job = createJob(ownerId, {
    type: 'provider_worker',
    title,
    projectId: input.projectId || request.projectId || null,
    maxAttempts: 1,
    payload: {
      providerId: provider.id,
      providerName: provider.name,
      providerCategory: provider.category,
      setupMode: provider.setupMode,
      dryRun: true,
      workerManifest: setup.workerManifest,
      request,
      checklist: setup.checklist,
      blockingCautions: setup.blockingCautions
    }
  });

  const completed = updateJob(job.id, {
    status: readiness.runnable ? 'completed' : 'failed',
    progress: 100,
    attempts: 1,
    error: readiness.runnable ? null : readiness.message,
    result: {
      ...readiness,
      providerId: provider.id,
      providerName: provider.name,
      commandTemplate: setup.workerManifest.commandTemplate,
      inputs: setup.workerManifest.inputs,
      outputs: setup.workerManifest.outputs,
      request,
      nextActions: setup.nextActions
    }
  });

  return getJob(completed.id, ownerId);
}
