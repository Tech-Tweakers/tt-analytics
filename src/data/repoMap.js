import churnPolarisLLM from './repos/code_churn_polaris-llm.js';
import reworkPolarisLLM from './repos/rework_rate_polaris-llm.js';

import churnPolarisPythonApi from './repos/code_churn_polaris-python-api.js';
import reworkPolarisPythonApi from './repos/rework_rate_polaris-python-api.js';

export const repoMap = {
    'polaris-python-api': {
        churn: churnPolarisPythonApi,
        rework: reworkPolarisPythonApi,
    },
    'polaris-llm': {
        churn: churnPolarisLLM,
        rework: reworkPolarisLLM,
    },
};