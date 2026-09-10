import { IJobProvider, ProviderSearchResult } from './IJobProvider';
import { CanonicalJob, JobSearchCriteria } from '../types/job.types';

/**
 * A fail-closed null provider used when no real external job API credentials 
 * are present in the environment. It explicitly refuses to fabricate job data,
 * adhering to the strict requirement: "Never invent external job data."
 */
export class NullJobProvider implements IJobProvider {
  async search(criteria: JobSearchCriteria): Promise<ProviderSearchResult> {
    return {
      status: 'NO_PROVIDER_CONFIGURED',
      jobs: [],
      error: 'No active job board API credentials found. Fake data is strictly disabled in production.'
    };
  }

  async getJob(externalJobId: string): Promise<CanonicalJob | null> {
    return null;
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
