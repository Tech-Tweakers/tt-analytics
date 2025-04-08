import churnPolarisLLM from './repos/code_churn_polaris-llm.js';
import reworkPolarisLLM from './repos/rework_rate_polaris-llm.js';

export const repoMap = {
  'polaris-llm': {
    churn: churnPolarisLLM,
    rework: reworkPolarisLLM,
  },
};