import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INode,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

/** Request options as the version 1 operations build them (request-library style). */
export interface V1RequestOptions {
	method: string;
	url: string;
	headers: Record<string, string>;
	body?: string | IDataObject;
	formData?: {
		file: { value: Buffer; options: { filename: string; contentType?: string } };
	};
}

/**
 * Sends a version 1 request with n8n's current HTTP helper and returns the raw response
 * text, as the deprecated request helper did, so the operations keep parsing it themselves.
 */
export async function paywiseV1Request(
	this: IExecuteFunctions,
	// addCommonHeaders.call() narrows the options type to `{ headers }`.
	requestOptions: V1RequestOptions | { headers: Record<string, string> },
): Promise<string> {
	const options = requestOptions as V1RequestOptions;
	const request: IHttpRequestOptions = {
		method: options.method as IHttpRequestMethods,
		url: options.url,
		headers: { ...options.headers },
		encoding: 'text',
		json: false,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	if (options.formData) {
		const { value, options: file } = options.formData.file;
		const form = new FormData();
		form.append('file', new Blob([value], { type: file.contentType }), file.filename);
		request.body = form;
	} else if (options.body !== undefined) {
		request.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
		request.headers!['Content-Type'] ??= 'application/json';
	}

	const response = (await this.helpers.httpRequestWithAuthentication.call(
		this,
		'paywiseApi',
		request,
	)) as IN8nHttpFullResponse;

	const text =
		typeof response.body === 'string' ? response.body : JSON.stringify(response.body ?? '');
	if (response.statusCode >= 400) {
		let body: JsonObject = {};
		try {
			body = JSON.parse(text) as JsonObject;
		} catch {
			body = { message: text };
		}
		throw new NodeApiError(this.getNode(), body, {
			httpCode: String(response.statusCode),
			description: text.slice(0, 2000),
		});
	}
	return text;
}

/** Keeps n8n errors as they are and wraps anything else in a NodeOperationError. */
export function asNodeError(node: INode, error: unknown): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) return error;
	return new NodeOperationError(node, error as Error);
}

/**
 * Enum for API types to distinguish between Case Management and Partner API
 */
export enum ApiType {
	CASE_MANAGEMENT = 'caseManagement',
	PARTNER = 'partner',
}

/**
 * Constructs the API URL based on the API type
 * @param this The execute functions context
 * @param apiType The type of API to use (Case Management or Partner)
 * @param resourcePath The path to the resource (e.g., 'claims', 'companies')
 * @param itemPath Optional item path (e.g., 'e2f8f69c-d5ef-4821-b334-d3b5769f9a70')
 * @returns The complete API URL
 */
export async function getApiUrl(
	this: IExecuteFunctions,
	apiType: ApiType,
	resourcePath: string,
	itemPath: string = '',
): Promise<string> {
	try {
		const credentials = (await this.getCredentials('paywiseApi')) as IDataObject;

		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'No credentials provided for Paywise API');
		}

		if (!credentials.baseUrl) {
			throw new NodeOperationError(
				this.getNode(),
				'Base URL is missing in Paywise API credentials',
			);
		}

		// Normalize the base URL by removing trailing slashes
		let baseUrl = credentials.baseUrl as string;
		baseUrl = baseUrl.replace(/\/+$/, '');

		// Get the appropriate subpath from credentials
		let subpath: string;
		if (apiType === ApiType.PARTNER) {
			subpath = (credentials.partnerApiSubpath as string) || '/partner/v1';
		} else {
			subpath = (credentials.caseManagementApiSubpath as string) || '/v1';
		}

		// Normalize subpath to have exactly one leading slash and no trailing slash
		subpath = '/' + subpath.replace(/^\/+|\/+$/g, '');

		// Validate resource path
		if (!resourcePath) {
			throw new NodeOperationError(this.getNode(), 'Resource path is required');
		}

		// Normalize resource path to have no leading slash and no trailing slash
		const formattedResourcePath = resourcePath.replace(/^\/+|\/+$/g, '');

		// Normalize item path to have no leading slash and no trailing slash if provided
		const formattedItemPath = itemPath ? itemPath.replace(/^\/+|\/+$/g, '') : '';

		// Construct the URL with normalized parts
		// Base URL is always used
		let url = baseUrl;

		// The subpath is always added from credentials
		url += subpath;

		// Add resource path if it exists
		if (formattedResourcePath) {
			url += `/${formattedResourcePath}`;
		}

		// Add item path if it exists
		if (formattedItemPath) {
			url += `/${formattedItemPath}`;
		}
		return url + '/';
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}

/**
 * Adds n8n User-Agent header to request options
 * @param options The request options
 * @returns The updated request options with User-Agent header
 */
export function addUserAgentHeader<T extends { headers: Record<string, string> }>(options: T): T {
	try {
		// Add n8n User-Agent header
		options.headers['User-Agent'] = 'n8n-paywise-node/1.0';

		return options;
	} catch {
		// Log the error but don't throw it to maintain backward compatibility
		return options;
	}
}

/**
 * Adds "Act on Behalf of Client" header if specified in the parameters
 * This is only applicable for Case Management API
 * @param this The execute functions context
 * @param options The request options
 * @param itemIndex The index of the item being processed
 * @returns The updated request options
 */
export function addActOnBehalfOfClientHeader<T extends { headers: Record<string, string> }>(
	this: IExecuteFunctions,
	options: T,
	itemIndex: number,
): T {
	try {
		// Check if "act on behalf of client" is enabled
		const actOnBehalfOfClient = this.getNodeParameter(
			'actOnBehalfOfClient',
			itemIndex,
			false,
		) as boolean;

		if (actOnBehalfOfClient) {
			const userId = this.getNodeParameter('userId', itemIndex, '') as string;

			if (!userId) {
				return options;
			}

			// Add the X-User-Id header
			options.headers['X-User-Id'] = userId;
		}

		return options;
	} catch {
		// Log the error but don't throw it to maintain backward compatibility
		return options;
	}
}

/**
 * Adds common headers (User-Agent and optionally Act on Behalf of Client) to request options
 * @param this The execute functions context
 * @param options The request options
 * @param itemIndex The index of the item being processed (optional, defaults to 0)
 * @returns The updated request options with all common headers
 */
export function addCommonHeaders<T extends { headers: Record<string, string> }>(
	this: IExecuteFunctions,
	options: T,
	itemIndex: number = 0,
): T {
	// Add User-Agent header
	let updatedOptions = addUserAgentHeader(options);

	// Add Act on Behalf of Client header if applicable
	updatedOptions = addActOnBehalfOfClientHeader.call(this, updatedOptions, itemIndex) as T;

	return updatedOptions;
}
