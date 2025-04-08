import churnPolarisLLM from 'src/data/repos/code_churn_polaris-llm.js';
import reworkPolarisLLM from 'src/data/repos/rework_rate_polaris-llm.js';

import churnPolarisPythonApi from 'src/data/repos/code_churn_polaris-python-api.js';
import reworkPolarisPythonApi from 'src/data/repos/rework_rate_polaris-python-api.js';

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