import { config } from '@n8n/node-cli/eslint';

export default [
	// Node version 1 (paywise API v1) is frozen and kept only for existing workflows.
	{ ignores: ['nodes/Paywise/v1/**', 'credentials/PaywiseApi.credentials.ts'] },
	...config,
];
