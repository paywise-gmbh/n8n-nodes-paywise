import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const deleteTokenFields: INodeProperties[] = [
	{
		displayName: 'Token ID',
		name: 'tokenId',
		type: 'string',
		default: '',
		description: 'The ID of the token to delete',
	},
];

export async function deleteToken(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[deleteToken] operation function called');
	
	try {
		// Get parameters from tokenDeleteParams collection
		const tokenParams = this.getNodeParameter('tokenDeleteParams', 0, {}) as { tokenId?: string };
		
		if (!tokenParams.tokenId) {
			throw new Error('Token ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'tokens', tokenParams.tokenId);
		
		// Make API request
		const options = {
			method: 'DELETE',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[deleteToken] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		// If we reach here, the token was successfully deleted
		console.log('[deleteToken] Token successfully deleted');
		
		// Return a success message
		return {
			success: true,
			message: `Token ${tokenParams.tokenId} was successfully deleted`,
		};
	} catch (error) {
		console.error('[deleteToken] Error:', error);
		throw error;
	}
} 