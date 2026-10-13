import type { IExecuteFunctions } from 'n8n-workflow';
import { IDataObject } from 'n8n-workflow';

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
		const credentials = await this.getCredentials('paywiseApi') as IDataObject;
		
		if (!credentials) {
			throw new Error('No credentials provided for Paywise API');
		}
		
		if (!credentials.baseUrl) {
			throw new Error('Base URL is missing in Paywise API credentials');
		}

		// Normalize the base URL by removing trailing slashes
		let baseUrl = credentials.baseUrl as string;
		baseUrl = baseUrl.replace(/\/+$/, '');
		
		// Get the appropriate subpath from credentials
		let subpath: string;
		if (apiType === ApiType.PARTNER) {
			subpath = credentials.partnerApiSubpath as string || '/partner/v1';
		} else {
			subpath = credentials.caseManagementApiSubpath as string || '/v1';
		}
		
		// Normalize subpath to have exactly one leading slash and no trailing slash
		subpath = '/' + subpath.replace(/^\/+|\/+$/g, '');
		
		console.log(`[getApiUrl] Using ${apiType === ApiType.PARTNER ? 'Partner' : 'Case Management'} API subpath: ${subpath}`);

		// Validate resource path
		if (!resourcePath) {
			throw new Error('Resource path is required');
		}

		// Normalize resource path to have no leading slash and no trailing slash
		const formattedResourcePath = resourcePath.replace(/^\/+|\/+$/g, '');
		
		// Normalize item path to have no leading slash and no trailing slash if provided
		const formattedItemPath = itemPath 
			? itemPath.replace(/^\/+|\/+$/g, '')
			: '';

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
		
		console.log(`[getApiUrl] Constructed URL: ${url}`);
		return url+'/';
	} catch (error) {
		console.error('[getApiUrl] Error constructing API URL:', error);
		throw error;
	}
}

/**
 * Adds n8n User-Agent header to request options
 * @param options The request options
 * @returns The updated request options with User-Agent header
 */
export function addUserAgentHeader(options: { headers: Record<string, string> }): { headers: Record<string, string> } {
	try {
		// Add n8n User-Agent header
		options.headers['User-Agent'] = 'n8n-paywise-node/1.0';
		console.log('[addUserAgentHeader] Added User-Agent header');
		
		return options;
	} catch (error) {
		// Log the error but don't throw it to maintain backward compatibility
		console.error('[addUserAgentHeader] Error adding User-Agent header:', error);
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
export function addActOnBehalfOfClientHeader(
	this: IExecuteFunctions, 
	options: { headers: Record<string, string> },
	itemIndex: number,
): { headers: Record<string, string> } {
	try {
		// Check if "act on behalf of client" is enabled
		const actOnBehalfOfClient = this.getNodeParameter('actOnBehalfOfClient', itemIndex, false) as boolean;
		
		if (actOnBehalfOfClient) {
			const userId = this.getNodeParameter('userId', itemIndex, '') as string;
			
			if (!userId) {
				console.warn('[addActOnBehalfOfClientHeader] Act on behalf of client is enabled but userId is not provided');
				return options;
			}
			
			// Add the X-User-Id header
			options.headers['X-User-Id'] = userId;
			console.log(`[addActOnBehalfOfClientHeader] Added X-User-Id header: ${userId}`);
		} else {
			console.log('[addActOnBehalfOfClientHeader] Act on behalf of client is not enabled');
		}
		
		return options;
	} catch (error) {
		// Log the error but don't throw it to maintain backward compatibility
		console.error('[addActOnBehalfOfClientHeader] Error adding Act on Behalf of Client header:', error);
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
export function addCommonHeaders(
	this: IExecuteFunctions, 
	options: { headers: Record<string, string> },
	itemIndex: number = 0,
): { headers: Record<string, string> } {
	// Add User-Agent header
	let updatedOptions = addUserAgentHeader(options);
	
	// Add Act on Behalf of Client header if applicable
	updatedOptions = addActOnBehalfOfClientHeader.call(this, updatedOptions, itemIndex);
	
	return updatedOptions;
}
