import { createHmac, timingSafeEqual } from 'crypto';

/** Deliveries older or newer than this are rejected as possible replays. */
export const TOLERANCE_SECONDS = 5 * 60;

export interface SignatureInput {
	secret: string;
	webhookId: string;
	timestamp: string;
	signatureHeader: string;
	rawBody: Buffer;
	now?: number;
}

export function sign(secret: string, webhookId: string, timestamp: string, rawBody: Buffer) {
	const message = Buffer.concat([Buffer.from(`${webhookId}.${timestamp}.`, 'utf8'), rawBody]);
	return createHmac('sha256', Buffer.from(secret, 'utf8')).update(message).digest();
}

/**
 * Verifies a Standard-Webhooks style `webhook-signature` header (`v1,<base64>` entries,
 * space-separated; two entries during a secret rotation). See
 * https://docs.paywise.de/api-docs/essentials/webhooks
 */
export function verifySignature({
	secret,
	webhookId,
	timestamp,
	signatureHeader,
	rawBody,
	now = Date.now(),
}: SignatureInput): boolean {
	if (!secret || !webhookId || !timestamp || !signatureHeader) return false;

	const sentAt = Number(timestamp);
	if (!Number.isInteger(sentAt) || Math.abs(now / 1000 - sentAt) > TOLERANCE_SECONDS) {
		return false;
	}

	const expected = sign(secret, webhookId, timestamp, rawBody);
	return signatureHeader.split(' ').some((entry) => {
		const [version, encoded] = entry.split(',', 2);
		if (version !== 'v1' || !encoded) return false;
		const received = Buffer.from(encoded, 'base64');
		return received.length === expected.length && timingSafeEqual(received, expected);
	});
}
