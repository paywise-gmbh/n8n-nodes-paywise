// Runs against the build output: `npm run build && npm test`.
const { test } = require('node:test');
const assert = require('node:assert');
const { sign, verifySignature } = require('../dist/nodes/PaywiseTrigger/signature.js');

// Known-answer vector from https://docs.paywise.de/api-docs/essentials/webhooks
const vector = {
	secret: 'whsec_test_0123456789abcdef',
	webhookId: 'msg_2b5c1e9d4f8a',
	timestamp: '1756800000',
	rawBody: Buffer.from('{"id":"msg_2b5c1e9d4f8a","type":"order.accepted"}'),
	now: 1756800000 * 1000,
};
const expected = 'v1,cePL6RRZ5U5l9c1ik1KH+BCyH0Zd+CO0Rj2dZej25No=';

test('signs the documented known-answer vector', () => {
	const digest = sign(vector.secret, vector.webhookId, vector.timestamp, vector.rawBody);
	assert.strictEqual(`v1,${digest.toString('base64')}`, expected);
});

test('accepts a valid signature, also next to a rotated one', () => {
	assert.ok(verifySignature({ ...vector, signatureHeader: expected }));
	assert.ok(verifySignature({ ...vector, signatureHeader: `v1,AAAA ${expected}` }));
});

test('rejects tampered bodies, wrong secrets and stale timestamps', () => {
	assert.ok(!verifySignature({ ...vector, signatureHeader: expected, rawBody: Buffer.from('{}') }));
	assert.ok(!verifySignature({ ...vector, signatureHeader: expected, secret: 'other' }));
	assert.ok(
		!verifySignature({ ...vector, signatureHeader: expected, now: vector.now + 10 * 60 * 1000 }),
	);
	assert.ok(!verifySignature({ ...vector, signatureHeader: 'v2,' + expected.slice(3) }));
	assert.ok(!verifySignature({ ...vector, signatureHeader: '' }));
});
