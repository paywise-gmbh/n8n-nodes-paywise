import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';

export async function getToken(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getToken] operation function called');
	
	try {
		// Get API URL for info endpoint (this will return current token info)
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'info');
		
		// Make API request
		const options = {
			method: 'GET',
			url: url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		
		console.log('[getToken] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[getToken] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getToken] Error:', error);
		throw error;
	}
}
