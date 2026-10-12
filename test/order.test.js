// Request-level tests for node version 2 with a fake n8n execution context.
// Runs against the build output: `npm run build && npm test`.
const { test } = require('node:test');
const assert = require('node:assert');
const { run, ok } = require('./helpers.js');

test('create with submit posts the order, then finalizes it, with stable idempotency keys', async () => {
	const params = {
		resource: 'order',
		operation: 'create',
		orderType: 'invoice',
		debtorId: 'd-1',
		claims:
			'[{"type":"receivable","is_disputed":false,"principal_amount":{"value":"10.00","currency":"EUR"}}]',
		submit: true,
		additionalFields: {
			starting_approach: 'extrajudicial',
			additional_debtor_ids: 'd-2, d-3',
			confirmation_email: '',
		},
	};
	const { output, requests } = await run(params, [
		ok({ id: 'o-1', status: 'draft' }, 201),
		ok({ id: 'o-1', status: 'submitted' }),
	]);

	assert.strictEqual(requests.length, 2);
	const [create, finalize] = requests;
	assert.strictEqual(create.credential, 'paywiseV2Api');
	assert.strictEqual(create.method, 'POST');
	assert.strictEqual(create.url, 'https://api-sandbox.paywise.de/v2/orders/');
	assert.deepStrictEqual(create.body, {
		type: 'invoice',
		debtor_id: 'd-1',
		claims: [
			{
				type: 'receivable',
				is_disputed: false,
				principal_amount: { value: '10.00', currency: 'EUR' },
			},
		],
		starting_approach: 'extrajudicial',
		additional_debtor_ids: ['d-2', 'd-3'],
	});
	assert.match(create.headers['Idempotency-Key'], /^n8n-[0-9a-f]{64}$/);
	assert.strictEqual(finalize.url, 'https://api-sandbox.paywise.de/v2/orders/o-1/finalize/');
	assert.notStrictEqual(finalize.headers['Idempotency-Key'], create.headers['Idempotency-Key']);
	assert.deepStrictEqual(output[0].json, { id: 'o-1', status: 'submitted' });

	// Same execution, item and body (n8n "Retry On Fail") must reuse the key.
	const again = await run(params, [ok({ id: 'o-1' }, 201), ok({ id: 'o-1' })]);
	assert.strictEqual(
		again.requests[0].headers['Idempotency-Key'],
		create.headers['Idempotency-Key'],
	);
});

test('a custom idempotency key wins', async () => {
	const { requests } = await run(
		{
			resource: 'order',
			operation: 'finalize',
			orderId: 'o-9',
			options: { idempotencyKey: 'INV-42' },
		},
		[ok({ id: 'o-9' })],
	);
	assert.strictEqual(requests[0].headers['Idempotency-Key'], 'INV-42');
});

test('get many follows next links until the limit', async () => {
	const { output, requests } = await run(
		{
			resource: 'order',
			operation: 'getAll',
			returnAll: false,
			limit: 3,
			filters: { status: 'submitted', q: '' },
		},
		[
			ok({
				count: 4,
				next: 'https://api-sandbox.paywise.de/v2/orders/?cursor=abc',
				results: [{ id: 1 }, { id: 2 }],
			}),
			ok({ count: 4, next: null, results: [{ id: 3 }, { id: 4 }] }),
		],
	);
	assert.deepStrictEqual(requests[0].qs, { status: 'submitted', limit: 3 });
	assert.strictEqual(requests[1].url, 'https://api-sandbox.paywise.de/v2/orders/?cursor=abc');
	assert.strictEqual(requests[1].qs, undefined);
	assert.deepStrictEqual(
		output.map((item) => item.json.id),
		[1, 2, 3],
	);
});

test('API errors surface detail, field errors and request id', async () => {
	const error = {
		statusCode: 400,
		headers: { 'x-paywise-request-id': 'req-7' },
		body: {
			detail: 'Validation failed',
			code: 'validation_error',
			errors: [
				{
					field: 'claims[0].principal_amount',
					code: 'required',
					message: 'This field is required.',
				},
			],
		},
	};
	await assert.rejects(
		run(
			{
				resource: 'order',
				operation: 'create',
				orderType: 'invoice',
				debtorId: 'd-1',
				claims: '[]',
			},
			[error],
		),
		(e) => {
			assert.strictEqual(e.message, 'Validation failed');
			assert.strictEqual(e.httpCode, '400');
			assert.match(e.description, /claims\[0\]\.principal_amount: This field is required\./);
			assert.match(e.description, /Request ID: req-7/);
			return true;
		},
	);

	const { output } = await run(
		{ resource: 'order', operation: 'get', orderId: 'x' },
		[{ ...error, statusCode: 404 }],
		{
			continueOnFail: true,
		},
	);
	assert.strictEqual(output[0].json.error, 'Validation failed');
});

test('delete returns a confirmation for the 204 response', async () => {
	const { output, requests } = await run(
		{ resource: 'order', operation: 'delete', orderId: 'o/1' },
		[{ statusCode: 204, headers: {}, body: '' }],
	);
	assert.strictEqual(requests[0].method, 'DELETE');
	assert.strictEqual(requests[0].url, 'https://api-sandbox.paywise.de/v2/orders/o%2F1/');
	assert.deepStrictEqual(output[0].json, { id: 'o/1', deleted: true });
});
