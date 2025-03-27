import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const getOnboardedUserFields: INodeProperties[] = [
	{
		displayName: 'User Invite ID',
		name: 'inviteId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the user invite to get the onboarded user from',
	},
];

export async function getOnboardedUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getOnboardedUser] operation function called');
	
	try {
		// Get invite ID from parameters
		const inviteParams = this.getNodeParameter('inviteParams', 0, {});
		
		if (!inviteParams.inviteId) {
			throw new Error('User Invite ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'userinvites',
			`${inviteParams.inviteId as string}/user/`,
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