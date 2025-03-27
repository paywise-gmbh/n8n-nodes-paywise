import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const getTokenFields: INodeProperties[] = [
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		default: '',
		description: 'The ID of the token to retrieve',
	},
];

export async function getToken(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getToken] operation function called');
	
	try {
		// Get parameters from tokenParams collection
		const tokenParams = this.getNodeParameter('tokenParams', 0, {}) as { tokenId?: string };
		
		if (!tokenParams.tokenId) {
			throw new Error('Token ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'tokens', tokenParams.tokenId);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
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