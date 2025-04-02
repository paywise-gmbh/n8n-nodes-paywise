import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const getOnboardedUserFields: INodeProperties[] = [
	{
		displayName: 'Invite ID',
		name: 'inviteId',
		type: 'string',
		default: '',
		description: 'The ID of the user invite to retrieve the onboarded user for',
	},
];

export async function getOnboardedUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getOnboardedUser] operation function called');
	
	try {
		// Get invite ID from parameters
		const inviteId = this.getNodeParameter('inviteId', 0) as string;
		
		if (!inviteId) {
			throw new Error('Invite ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'user_invites',
			`${inviteId}/user`,
		);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getOnboardedUser] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getOnboardedUser] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getOnboardedUser] Error:', error);
		throw error;
	}
}