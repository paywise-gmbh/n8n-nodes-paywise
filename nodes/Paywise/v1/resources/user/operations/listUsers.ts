import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties
export const listUsersFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [
			{
				displayName: 'Company ID',
				name: 'company',
				type: 'string',
				default: '',
				description: 'Filter by company UUID',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Filter by email address',
			},
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
				description: 'Filter by first name',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				description: 'Filter by last name',
			},
			{
				displayName: 'User ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by user UUID',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		description: 'The initial index from which to return the results',
	},
];

function mapListUsersParams(options: {
	limit?: number;
	offset?: number;
	filters?: Record<string, string>;
}) {
	const filters = options.filters || {};
	const limit = options.limit || 10;
	const offset = options.offset || 0;

	const params: Record<string, string | number> = {
		limit,
		offset,
	};

	// Add filters if present
	if (filters.id) {
		params.id = filters.id;
	}

	if (filters.email) {
		params.email = filters.email;
	}

	if (filters.first_name) {
		params.first_name = filters.first_name;
	}

	if (filters.last_name) {
		params.last_name = filters.last_name;
	}

	if (filters.company) {
		params.company = filters.company;
	}
	return params;
}

export async function listUsers(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get parameters
		const filters = this.getNodeParameter('filters', 0, {});
		const limit = this.getNodeParameter('limit', 0, 10) as number;
		const offset = this.getNodeParameter('offset', 0, 0) as number;

		// Combine all parameters
		const paramOptions = {
			filters,
			limit,
			offset,
		};

		// Get and process parameters
		const queryParams = mapListUsersParams(
			paramOptions as Parameters<typeof mapListUsersParams>[0],
		);
		const queryString = Object.entries(queryParams)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
			.join('&');

		// Get API URL
		const baseUrl = await getApiUrl.call(this, ApiType.PARTNER, 'users');
		const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

		// Make API request
		const requestOptions = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(requestOptions);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
