import churnPolarisllm from './code_churn_polaris-llm.js';
import reworkPolarisllm from './rework_rate_polaris-llm.js';

import churnPolarispythonapi from './code_churn_polaris-python-api.js';
import reworkPolarispythonapi from './rework_rate_polaris-python-api.js';

export const repoMap = {
    'polaris-python-api': {
        churn: churnPolarispythonapi,
        rework: reworkPolarispythonapi,
    },
    'polaris-llm': {
        churn: churnPolarisllm,
        rework: reworkPolarisllm,
    },
};