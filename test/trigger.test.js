// Webhook lifecycle and delivery tests for the trigger with a fake n8n context.
// Runs against the build output: `npm run build && npm test`.
const { test } = require('node:test');
const assert = require('node:assert');
const { PaywiseTrigger } = require('../dist/nodes/PaywiseTrigger/PaywiseTrigger.node.js');
const { sign } = require('../dist/nodes/PaywiseTrigger/signature.js');

const WEBHOOK_URL = 'https://n8n.example.com/webhook/abc/webhook';

function hookContext(staticData, responses, parameters = {}) {
	const requests = [];
	return {
		requests,
		ctx: {
			getWorkflowStaticData: () => staticData,
			getNodeWebhookUrl: () => WEBHOOK_URL,
			getNodeParameter: (name, fallback) => parameters[name] ?? fallback,
			getWorkflow: () => ({ id: 'wf-1', name: 'Order events' }),
			getNode: () => ({
				id: 'node-1',
				name: 'paywise Trigger',
				type: 'paywiseTrigger',
				typeVersion: 1,
				parameters: {},
			}),
			getCredentials: async () => ({ environment: 'production', apiKey: 'key' }),
			helpers: {
				httpRequestWithAuthentication: async (_c, options) => {
					requests.push(options);
					return responses.shift() ?? { statusCode: 200, headers: {}, body: {} };
				},
				returnJsonArray: (data) => [{ json: data }],
			},
		},
	};
}

test('create registers the webhook and stores id and secret; delete removes it', async () => {
	const methods = new PaywiseTrigger().webhookMethods.default;
	const staticData = {};
	const create = hookContext(
		staticData,
		[{ statusCode: 201, headers: {}, body: { id: 'wh-1', secret_key: 'whsec_x' } }],
		{
			events: ['order.accepted', 'payment.reported'],
		},
	);
	assert.strictEqual(await methods.create.call(create.ctx), true);
	assert.strictEqual(create.requests[0].url, 'https://api.paywise.de/v2/webhooks/');
	assert.deepStrictEqual(create.requests[0].body.events, ['order.accepted', 'payment.reported']);
	assert.strictEqual(create.requests[0].body.url, WEBHOOK_URL);
	assert.ok(create.requests[0].headers['Idempotency-Key']);
	assert.deepStrictEqual(staticData, { webhookId: 'wh-1', secret: 'whsec_x' });

	const check = hookContext(staticData, [
		{ statusCode: 200, headers: {}, body: { id: 'wh-1', url: WEBHOOK_URL } },
	]);
	assert.strictEqual(await methods.checkExists.call(check.ctx), true);

	const del = hookContext(staticData, [
		{ statusCode: 404, headers: {}, body: { detail: 'Not found.' } },
	]);
	assert.strictEqual(await methods.delete.call(del.ctx), true);
	assert.strictEqual(del.requests[0].method, 'DELETE');
	assert.deepStrictEqual(staticData, {});
});

test('"All Events" subscribes with the wildcard only', async () => {
	const { ctx, requests } = hookContext(
		{},
		[{ statusCode: 201, headers: {}, body: { id: 'wh-2' } }],
		{
			events: ['*', 'order.accepted'],
		},
	);
	await new PaywiseTrigger().webhookMethods.default.create.call(ctx);
	assert.deepStrictEqual(requests[0].body.events, ['*']);
});

test('checkExists forgets a webhook that is gone on the paywise side', async () => {
	const staticData = { webhookId: 'wh-1', secret: 's' };
	const { ctx } = hookContext(staticData, [{ statusCode: 404, headers: {}, body: {} }]);
	assert.strictEqual(
		await new PaywiseTrigger().webhookMethods.default.checkExists.call(ctx),
		false,
	);
	assert.deepStrictEqual(staticData, {});
});

function delivery(headers, rawBody, secret = 'whsec_x') {
	let status;
	const body = JSON.parse(rawBody.toString());
	return {
		get status() {
			return status;
		},
		ctx: {
			getRequestObject: () => ({ rawBody }),
			getResponseObject: () => ({ status: (s) => ((status = s), { send: () => {} }) }),
			getNodeParameter: (_n, fallback) => fallback,
			getWorkflowStaticData: () => ({ secret }),
			getHeaderData: () => headers,
			getBodyData: () => body,
			helpers: { returnJsonArray: (data) => [{ json: data }] },
		},
	};
}

test('webhook emits signed deliveries and rejects forged ones', async () => {
	const trigger = new PaywiseTrigger();
	const rawBody = Buffer.from('{"id":"evt-1","type":"order.accepted","data":{"order_id":"o-1"}}');
	const timestamp = String(Math.floor(Date.now() / 1000));
	const signature = `v1,${sign('whsec_x', 'evt-1', timestamp, rawBody).toString('base64')}`;

	const good = delivery(
		{ 'webhook-id': 'evt-1', 'webhook-timestamp': timestamp, 'webhook-signature': signature },
		rawBody,
	);
	const result = await trigger.webhook.call(good.ctx);
	assert.strictEqual(result.workflowData[0][0].json.type, 'order.accepted');

	const forged = delivery(
		{ 'webhook-id': 'evt-1', 'webhook-timestamp': timestamp, 'webhook-signature': 'v1,Zm9yZ2Vk' },
		rawBody,
	);
	assert.deepStrictEqual(await trigger.webhook.call(forged.ctx), { noWebhookResponse: true });
	assert.strictEqual(forged.status, 401);
});
