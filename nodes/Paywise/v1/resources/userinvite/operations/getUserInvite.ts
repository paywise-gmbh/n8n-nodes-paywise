import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

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
	try {
		// Get invite ID from parameters
		const inviteId = this.getNodeParameter('inviteId', 0) as string;

		if (!inviteId) {
			throw new NodeOperationError(this.getNode(), 'User Invite ID is required');
		}

		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'user_invites', inviteId);

		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
