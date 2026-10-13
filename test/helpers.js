// Fake n8n execution context for request-level tests of node version 2.
const { PaywiseV2 } = require('../dist/nodes/Paywise/v2/PaywiseV2.node.js');

function run(parameters, responses, { continueOnFail = false, items = 1, binary } = {}) {
	const requests = [];
	const queue = [...responses];
	const ctx = {
		getInputData: () => Array.from({ length: items }, () => ({ json: {} })),
		getNodeParameter(name, _i, fallback) {
			const value = name.split('.').reduce((o, k) => (o == null ? undefined : o[k]), parameters);
			return value === undefined ? fallback : value;
		},
		getNode: () => ({
			id: 'node-1',
			name: 'paywise',
			type: 'paywise',
			typeVersion: 2,
			parameters: {},
		}),
		getExecutionId: () => 'exec-1',
		getCredentials: async () => ({ environment: 'sandbox', apiKey: 'pw_sbx_test' }),
		continueOnFail: () => continueOnFail,
		helpers: {
			httpRequestWithAuthentication: async (credential, options) => {
				requests.push({ credential, ...options });
				return queue.shift() ?? { statusCode: 200, headers: {}, body: {} };
			},
			returnJsonArray: (data) => (Array.isArray(data) ? data : [data]).map((json) => ({ json })),
			constructExecutionMetaData: (items, { itemData }) =>
				items.map((item) => ({ ...item, pairedItem: itemData })),
			assertBinaryData: () => binary.meta,
			getBinaryDataBuffer: async () => binary.buffer,
			prepareBinaryData: async (data, fileName, mimeType) => ({
				data: data.toString('base64'),
				fileName,
				mimeType,
				fileSize: String(data.length),
			}),
		},
	};
	const node = new PaywiseV2({
		displayName: 'paywise',
		name: 'paywise',
		group: [],
		description: '',
	});
	return node.execute.call(ctx).then((output) => ({ output: output[0], requests }));
}

const ok = (body, statusCode = 200) => ({ statusCode, headers: {}, body });

module.exports = { run, ok };
