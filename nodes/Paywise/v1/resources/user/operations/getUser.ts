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
	try {
		// Get user ID from parameters
		const userId = this.getNodeParameter('userId', 0) as string;

		if (!userId) {
			throw new NodeOperationError(this.getNode(), 'User ID is required');
		}

		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'users', userId);

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
