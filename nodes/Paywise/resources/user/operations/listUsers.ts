import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
				displayName: 'User ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by user ID',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'Filter by user email',
			},
			{
				displayName: 'Company ID',
				name: 'company_id',
				type: 'string',
				default: '',
				description: 'Filter by company ID',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
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
		description: 'Offset for pagination',
	},
];

function mapListUsersParams(options: any) {
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
	
	if (filters.company_id) {
		params.company_id = filters.company_id;
	}
	
	console.log('[listUsers] Mapped parameters:', params);
	return params;
}

export async function listUsers(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[listUsers] operation function called');
	
	try {
		// Get parameters from userListOptions collection
		const listOptions = this.getNodeParameter('userListOptions', 0, {});
		
		// Get and process parameters
		const queryParams = mapListUsersParams(listOptions);
		const queryString = Object.entries(queryParams)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
			.join('&');
		
		// Get API URL
		const baseUrl = await getApiUrl.call(this, ApiType.PARTNER, 'users');
		const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[listUsers] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[listUsers] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[listUsers] Error listing users:', error);
		throw error;
	}
} 