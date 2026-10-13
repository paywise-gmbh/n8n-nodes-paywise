import { createHash } from 'crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IN8nHttpFullResponse,
	IWebhookFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export const CREDENTIAL_NAME = 'paywiseV2Api';

const USER_AGENT = 'n8n-nodes-paywise/2';

const ENVIRONMENT_HOSTS: Record<string, string> = {
	production: 'https://api.paywise.de',
	sandbox: 'https://api-sandbox.paywise.de',
};

type Context = IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions | IWebhookFunctions;

export interface PaywiseRequestOptions {
	body?: IDataObject;
	qs?: IDataObject;
	/** Sent as Idempotency-Key; the API requires one on every effectful POST. */
	idempotencyKey?: string;
	itemIndex?: number;
}

interface PaywiseErrorBody {
	detail?: string;
	code?: string;
	errors?: Array<{ field?: string; code?: string; message?: string }>;
}

export async function getBaseUrl(this: Context): Promise<string> {
	const credentials = await this.getCredentials(CREDENTIAL_NAME);
	const environment = credentials.environment as string;
	const baseUrl =
		environment === 'custom' ? (credentials.baseUrl as string) : ENVIRONMENT_HOSTS[environment];
	return (baseUrl ?? ENVIRONMENT_HOSTS.production).replace(/\/+$/, '');
}

/**
 * Calls the paywise API v2. `path` is relative to the host (e.g. `/v2/orders/`) or an
 * absolute `next` URL taken from a list response.
 */
export async function paywiseApiRequest(
	this: Context,
	method: IHttpRequestMethods,
	path: string,
	{ body, qs, idempotencyKey, itemIndex }: PaywiseRequestOptions = {},
): Promise<IDataObject> {
	const url = /^https?:\/\//.test(path) ? path : `${await getBaseUrl.call(this)}${path}`;

	const headers: IDataObject = {
		Accept: 'application/json',
		'User-Agent': USER_AGENT,
	};
	if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

	const options: IHttpRequestOptions = {
		method,
		url,
		headers,
		qs,
		// Filters like processing_state accept several values as repeated parameters.
		arrayFormat: 'repeat',
		json: true,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};
	if (body !== undefined) options.body = body;

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		CREDENTIAL_NAME,
		options,
	)) as IN8nHttpFullResponse;

	if (response.statusCode >= 400) {
		throw buildApiError.call(this, response, itemIndex);
	}
	if (response.statusCode === 204 || response.body === '' || response.body === undefined) {
		return {};
	}
	return response.body as IDataObject;
}

export interface PaywiseDownload {
	data: Buffer;
	fileName?: string;
	mimeType?: string;
}

/** Downloads a file endpoint (`.../download/`) as raw bytes. */
export async function paywiseApiDownload(
	this: IExecuteFunctions,
	path: string,
	{ qs, itemIndex }: PaywiseRequestOptions = {},
): Promise<PaywiseDownload> {
	const response = (await this.helpers.httpRequestWithAuthentication.call(this, CREDENTIAL_NAME, {
		method: 'GET',
		url: `${await getBaseUrl.call(this)}${path}`,
		headers: { 'User-Agent': USER_AGENT },
		qs,
		encoding: 'arraybuffer',
		json: false,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	})) as IN8nHttpFullResponse;

	const data = Buffer.from(response.body as ArrayBuffer);
	if (response.statusCode >= 400) {
		let body: unknown = {};
		try {
			body = JSON.parse(data.toString('utf8'));
		} catch {
			// Not a JSON error envelope; report the status only.
		}
		throw buildApiError.call(this, { ...response, body: body as IDataObject }, itemIndex);
	}

	const disposition = String(response.headers['content-disposition'] ?? '');
	const fileName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];
	// Some documents are served as octet-stream; leave the type open so n8n derives it
	// from the file extension instead.
	const mimeType = (response.headers['content-type'] as string | undefined)?.split(';')[0];
	return {
		data,
		fileName: fileName ? decodeURIComponent(fileName) : undefined,
		mimeType: mimeType === 'application/octet-stream' ? undefined : mimeType,
	};
}

/**
 * Follows `next` links of a paginated list (`{count, next, previous, results}`, or the
 * cursor variant when `updated_since` is set) until `limit` results are collected.
 */
export async function paywiseApiRequestAllItems(
	this: Context,
	path: string,
	qs: IDataObject = {},
	limit = Infinity,
	itemIndex?: number,
): Promise<IDataObject[]> {
	const results: IDataObject[] = [];
	let next: string | null = path;
	let query: IDataObject | undefined = { ...qs, limit: Math.min(100, limit) };

	while (next && results.length < limit) {
		const page: IDataObject = await paywiseApiRequest.call(this, 'GET', next, {
			qs: query,
			itemIndex,
		});
		results.push(...((page.results as IDataObject[]) ?? []));
		next = (page.next as string | null) ?? null;
		// `next` already carries every query parameter.
		query = undefined;
	}
	return results.slice(0, limit);
}

/**
 * Derives a stable Idempotency-Key, so n8n's "Retry On Fail" replays the original
 * response instead of creating a duplicate. The body is part of the seed because a node
 * inside a loop sees the same item index with different data on every pass.
 */
export function idempotencyKeyFor(
	this: IExecuteFunctions,
	itemIndex: number,
	operation: string,
	body: unknown = {},
): string {
	const custom = this.getNodeParameter('options.idempotencyKey', itemIndex, '') as string;
	if (custom) return custom;

	const seed = [
		this.getExecutionId(),
		this.getNode().id,
		itemIndex,
		operation,
		JSON.stringify(body),
	].join(':');
	return `n8n-${createHash('sha256').update(seed).digest('hex')}`;
}

function buildApiError(
	this: Context,
	response: IN8nHttpFullResponse,
	itemIndex?: number,
): NodeApiError {
	const body = (typeof response.body === 'object' ? response.body : {}) as PaywiseErrorBody;
	const requestId = response.headers?.['x-paywise-request-id'] as string | undefined;

	const lines = (body.errors ?? []).map(
		(e) => `${e.field ? `${e.field}: ` : ''}${e.message ?? e.code ?? ''}`,
	);
	if (body.code) lines.unshift(`Code: ${body.code}`);
	if (requestId) lines.push(`Request ID: ${requestId}`);

	// Some n8n surfaces (e.g. workflow activation) show only the message, so it carries
	// the first field error as well.
	const firstError = body.errors?.[0];
	const detail = body.detail ?? `paywise API request failed with status ${response.statusCode}`;
	return new NodeApiError(this.getNode(), body as JsonObject, {
		message: firstError?.message
			? `${detail} ${firstError.field ? `${firstError.field}: ` : ''}${firstError.message}`
			: detail,
		description: lines.join('\n') || undefined,
		httpCode: String(response.statusCode),
		itemIndex,
	});
}

/** Parses a JSON parameter that n8n may hand over as a string or as an already parsed value. */
export function parseJsonParameter<T>(
	context: IExecuteFunctions,
	name: string,
	itemIndex: number,
	fallback: T,
): T {
	const raw = context.getNodeParameter(name, itemIndex, fallback) as unknown;
	if (typeof raw !== 'string') return raw as T;
	if (raw.trim() === '') return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		throw new NodeOperationError(context.getNode(), `Parameter "${name}" is not valid JSON`, {
			itemIndex,
		});
	}
}
