// Request-level tests for the node version 2 resources besides orders.
// Runs against the build output: `npm run build && npm test`.
const { test } = require('node:test');
const assert = require('node:assert');
const { run, ok } = require('./helpers.js');

const HOST = 'https://api-sandbox.paywise.de';

test('debtor create builds a consumer with address and channels', async () => {
	const { requests } = await run(
		{
			resource: 'debtor',
			operation: 'create',
			actingAs: 'consumer',
			firstName: 'Alex',
			lastName: 'Example',
			street: 'Musterstraße 1',
			postalCode: '10115',
			city: 'Berlin',
			country: 'DE',
			additionalFields: {
				email: 'alex@example.test',
				salutation: 'mx',
				yourReference: 'C-1',
				extra: '{"metadata":[{"type":"note","value":"x"}]}',
			},
		},
		[ok({ id: 'd-1' }, 201)],
	);
	assert.strictEqual(requests[0].url, `${HOST}/v2/debtors/`);
	assert.deepStrictEqual(requests[0].body, {
		acting_as: 'consumer',
		person: { first_name: 'Alex', last_name: 'Example', salutation: 'mx' },
		addresses: [
			{
				street: 'Musterstraße 1',
				postal_code: '10115',
				city: 'Berlin',
				country: 'DE',
				primary: true,
			},
		],
		communication_channels: [{ type: 'email', value: 'alex@example.test' }],
		your_reference: 'C-1',
		metadata: [{ type: 'note', value: 'x' }],
	});
	assert.ok(requests[0].headers['Idempotency-Key']);
});

test('debtor create builds a business with legal form', async () => {
	const { requests } = await run(
		{
			resource: 'debtor',
			operation: 'create',
			actingAs: 'business',
			organizationName: 'Example GmbH',
			legalForm: 'gmbh',
			street: 'Weg 2',
			postalCode: '20095',
			city: 'Hamburg',
			country: 'DE',
		},
		[ok({ id: 'd-2' }, 201)],
	);
	assert.deepStrictEqual(requests[0].body.organization, { name: 'Example GmbH' });
	assert.strictEqual(requests[0].body.legal_form, 'gmbh');
	assert.strictEqual(requests[0].body.person, undefined);
});

test('claim create adds the order ID; update patches', async () => {
	const create = await run(
		{
			resource: 'claim',
			operation: 'create',
			orderId: 'o-1',
			claim: '{"type":"receivable","is_disputed":false}',
		},
		[ok({ id: 'c-1' }, 201)],
	);
	assert.deepStrictEqual(create.requests[0].body, {
		type: 'receivable',
		is_disputed: false,
		order_id: 'o-1',
	});
	const update = await run(
		{
			resource: 'claim',
			operation: 'update',
			claimId: 'c-1',
			updateBody: '{"due_date":"2026-07-31"}',
		},
		[ok({})],
	);
	assert.strictEqual(update.requests[0].method, 'PATCH');
	assert.strictEqual(update.requests[0].url, `${HOST}/v2/claims/c-1/`);
});

test('claim document upload sends the binary as base64', async () => {
	const { requests } = await run(
		{
			resource: 'claimDocument',
			operation: 'upload',
			claimId: 'c-1',
			documentType: 'invoice',
			binaryPropertyName: 'data',
		},
		[ok({ id: 'doc-1', status: 'pending' }, 201)],
		{
			binary: {
				meta: { fileName: 'RE-1.pdf', mimeType: 'application/pdf' },
				buffer: Buffer.from('%PDF-1.4'),
			},
		},
	);
	assert.strictEqual(requests[0].url, `${HOST}/v2/claims/c-1/documents/`);
	assert.deepStrictEqual(requests[0].body, {
		type: 'invoice',
		filename: 'RE-1.pdf',
		base64: Buffer.from('%PDF-1.4').toString('base64'),
	});
});

test('statement download returns a binary item with the server file name', async () => {
	const { output, requests } = await run(
		{
			resource: 'statement',
			operation: 'download',
			statementId: 's-1',
			fileType: 'cost-burden-xlsx',
			binaryPropertyName: 'file',
		},
		[
			{
				statusCode: 200,
				headers: {
					'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
					'content-disposition': 'attachment; filename="SA-1.xlsx"',
				},
				body: Buffer.from('xlsx-bytes'),
			},
		],
	);
	assert.strictEqual(requests[0].url, `${HOST}/v2/statements/s-1/download/`);
	assert.deepStrictEqual(requests[0].qs, { type: 'cost-burden-xlsx' });
	assert.strictEqual(requests[0].encoding, 'arraybuffer');
	assert.strictEqual(output[0].binary.file.fileName, 'SA-1.xlsx');
	assert.strictEqual(Buffer.from(output[0].binary.file.data, 'base64').toString(), 'xlsx-bytes');
});

test('octet-stream downloads leave the MIME type to n8n', async () => {
	const { output } = await run(
		{
			resource: 'mandate',
			operation: 'downloadDocument',
			mandateId: 'm-1',
			documentId: 'd-1',
			binaryPropertyName: 'data',
		},
		[
			{
				statusCode: 200,
				headers: {
					'content-type': 'application/octet-stream',
					'content-disposition': 'attachment; filename="letter.pdf"',
				},
				body: Buffer.from('%PDF'),
			},
		],
	);
	assert.strictEqual(output[0].binary.data.fileName, 'letter.pdf');
	assert.strictEqual(output[0].binary.data.mimeType, undefined);
});

test('download errors still surface the paywise error envelope', async () => {
	await assert.rejects(
		run(
			{
				resource: 'mandate',
				operation: 'downloadDocument',
				mandateId: 'm-1',
				documentId: 'x',
				binaryPropertyName: 'data',
			},
			[
				{
					statusCode: 404,
					headers: {},
					body: Buffer.from('{"detail":"Not found.","code":"not_found"}'),
				},
			],
		),
		(e) => e.message === 'Not found.' && /Code: not_found/.test(e.description),
	);
});

test('mandate filters drop empty multi-selects and send repeated values', async () => {
	const { requests } = await run(
		{
			resource: 'mandate',
			operation: 'getAll',
			returnAll: false,
			limit: 10,
			filters: { processing_state: ['in_progress', 'paused'], payment_state: [], q: '' },
		},
		[ok({ next: null, results: [] })],
	);
	assert.deepStrictEqual(requests[0].qs, {
		processing_state: ['in_progress', 'paused'],
		limit: 10,
	});
	assert.strictEqual(requests[0].arrayFormat, 'repeat');
});

test('payment report targets mandate or claim with a two-decimal amount', async () => {
	const onMandate = await run(
		{
			resource: 'payment',
			operation: 'report',
			target: 'mandate',
			mandateId: 'm-1',
			amount: 50,
			currency: 'EUR',
			valueDate: '2026-10-01T00:00:00.000Z',
			yourReference: '',
		},
		[ok({ id: 'p-1' }, 201)],
	);
	assert.strictEqual(onMandate.requests[0].url, `${HOST}/v2/mandates/m-1/payments/`);
	assert.deepStrictEqual(onMandate.requests[0].body, {
		amount: { value: '50.00', currency: 'EUR' },
		value_date: '2026-10-01',
	});

	const onClaim = await run(
		{
			resource: 'payment',
			operation: 'report',
			target: 'claim',
			claimId: 'c-1',
			amount: 12.5,
			currency: 'EUR',
			valueDate: '2026-10-02',
			yourReference: 'TX-1',
		},
		[ok({ id: 'p-2' }, 201)],
	);
	assert.strictEqual(onClaim.requests[0].url, `${HOST}/v2/claims/c-1/payments/`);
	assert.strictEqual(onClaim.requests[0].body.your_reference, 'TX-1');
});
