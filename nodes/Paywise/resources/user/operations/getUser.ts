import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const getUserFields: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'ID of the user to retrieve',
	},
];

export async function getUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getUser] operation function called');
	
	try {
		// Get parameters from userParams collection
		const userParams = this.getNodeParameter('userParams', 0, {});
		
		// Validate required parameters
		if (!userParams.userId) {
			throw new Error('User ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'users', userParams.userId as string);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getUser] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getUser] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getUser] Error retrieving user:', error);
		throw error;
	}
} 