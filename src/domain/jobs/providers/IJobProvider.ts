import { CanonicalJob, JobSearchCriteria } from '../types/job.types';

export interface ProviderSearchResult {
  status: 'SUCCESS' | 'NO_PROVIDER_CONFIGURED' | 'SOURCE_UNAVAILABLE' | 'SOURCE_RATE_LIMITED' | 'SOURCE_TIMEOUT';
  jobs: CanonicalJob[];
  error?: string;
}

export interface IJobProvider {
  /**
   * Search for jobs from the external source
   */
  search(criteria: JobSearchCriteria): Promise<ProviderSearchResult>;
  
  /**
   * Fetch a single job by its external ID
   */
  getJob(externalJobId: string): Promise<CanonicalJob | null>;

  /**
   * Check if the provider is healthy and correctly configured
   */
  healthCheck(): Promise<boolean>;
}
