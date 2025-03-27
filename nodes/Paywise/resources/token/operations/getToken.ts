import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
		
		console.log('[getToken] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getToken] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getToken] Error:', error);
		throw error;
	}
} 