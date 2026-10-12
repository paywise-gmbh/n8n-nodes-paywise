import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';

// Define operation field properties
export const getUserFields: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'The ID of the user to retrieve',
	},
];

export async function getUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getUser] operation function called');
	
	try {
		// Get user ID from parameters
		const userId = this.getNodeParameter('userId', 0) as string;
		
		if (!userId) {
			throw new Error('User ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'users',
			userId,
		);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		
		console.log('[getUser] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[getUser] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getUser] Error:', error);
		throw error;
	}
}
