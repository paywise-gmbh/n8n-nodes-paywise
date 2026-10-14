import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties, NodeOperationError } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addCommonHeaders,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties
export const listClaimsFields: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'Number of claims to skip',
	},
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description: 'Whether to act on behalf of a client company when making this request',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'ID of the user to act on behalf of',
		required: true,
		displayOptions: {
			show: {
				actOnBehalfOfClient: [true],
			},
		},
	},
];

/**
 * Maps node parameters for listClaims operation
 */
export function mapListClaimsParams(this: IExecuteFunctions): {
	limit: number;
	offset: number;
	actOnBehalfOfClient: boolean;
	userId?: string;
} {
	const limit = this.getNodeParameter('limit', 0, 10) as number;
	const offset = this.getNodeParameter('offset', 0, 0) as number;
	const actOnBehalfOfClient = this.getNodeParameter('actOnBehalfOfClient', 0, false) as boolean;

	const params: { limit: number; offset: number; actOnBehalfOfClient: boolean; userId?: string } = {
		limit,
		offset,
		actOnBehalfOfClient,
	};

	if (actOnBehalfOfClient) {
		params.userId = this.getNodeParameter('userId', 0) as string;

		if (!params.userId) {
			throw new NodeOperationError(
				this.getNode(),
				'User ID is required when acting on behalf of a client',
			);
		}
	}
	return params;
}

export async function listClaims(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Map parameters
		const { limit, offset } = mapListClaimsParams.call(this);

		// Convert parameters to query string
		const queryString = `limit=${limit}&offset=${offset}`;

		// Get API URL using the getApiUrl function
		const baseUrl = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims');
		const url = `${baseUrl}?${queryString}`;

		// Prepare request options
		const options = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
