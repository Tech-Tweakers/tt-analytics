// ⚡️ Arquivo gerado automaticamente pelo GitHub Actions

import churnPolarisbaby from './code_churn_polaris-baby.js';
import churnPolarischatbot from './code_churn_polaris-chatbot.js';
import churnPolarisfrontend from './code_churn_polaris-frontend.js';
import churnPolarisllm from './code_churn_polaris-llm.js';
import churnPolarispythonapi from './code_churn_polaris-python-api.js';
import churnTtanalytics from './code_churn_tt-analytics.js';
import reworkPolarisbaby from './rework_rate_polaris-baby.js';
import reworkPolarischatbot from './rework_rate_polaris-chatbot.js';
import reworkPolarisfrontend from './rework_rate_polaris-frontend.js';
import reworkPolarisllm from './rework_rate_polaris-llm.js';
import reworkPolarispythonapi from './rework_rate_polaris-python-api.js';
import reworkTtanalytics from './rework_rate_tt-analytics.js';

export const repoMap = {
  'polaris-baby': {
    churn: churnPolarisbaby,
    rework: reworkPolarisbaby,
  },
  'polaris-chatbot': {
    churn: churnPolarischatbot,
    rework: reworkPolarischatbot,
  },
  'polaris-frontend': {
    churn: churnPolarisfrontend,
    rework: reworkPolarisfrontend,
  },
  'polaris-llm': {
    churn: churnPolarisllm,
    rework: reworkPolarisllm,
  },
  'polaris-python-api': {
    churn: churnPolarispythonapi,
    rework: reworkPolarispythonapi,
  },
  'tt-analytics': {
    churn: churnTtanalytics,
    rework: reworkTtanalytics,
  },
};
