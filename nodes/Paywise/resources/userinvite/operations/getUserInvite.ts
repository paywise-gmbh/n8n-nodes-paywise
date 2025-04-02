import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const getUserInviteFields: INodeProperties[] = [
	{
		displayName: 'User Invite ID',
		name: 'inviteId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the user invite to retrieve',
	},
];

export async function getUserInvite(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getUserInvite] operation function called');
	
	try {
		// Get invite ID from parameters
		const inviteId = this.getNodeParameter('inviteId', 0) as string;
		
		if (!inviteId) {
			throw new Error('User Invite ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'user_invites',
			inviteId,
		);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getUserInvite] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getUserInvite] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getUserInvite] Error:', error);
		throw error;
	}
}