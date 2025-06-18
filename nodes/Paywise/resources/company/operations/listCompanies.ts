import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';

// Define operation field properties
export const listCompaniesFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by company ID',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by company name',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		required: false,
		description: 'Number of companies to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		required: false,
		description: 'Number of companies to skip',
	},
];

/**
 * Maps node parameters for listCompanies operation
 */
export function mapListCompaniesParams(this: IExecuteFunctions, options: any): { limit: number; offset: number; id?: string; name?: string } {
	console.log('[listCompanies] mapListCompaniesParams called');
	
	const limit = options.limit || 10;
	const offset = options.offset || 0;
	const filters = options.filters || {};
	
	const params: { limit: number; offset: number; id?: string; name?: string } = {
		limit,
		offset,
	};

	if (filters.id) {
		params.id = filters.id;
	}

	if (filters.name) {
		params.name = filters.name;
	}
	
	console.log('[listCompanies] parameters mapped:', params);
	return params;
}

export async function listCompanies(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[listCompanies] operation function called');
	
	try {
		// Get parameters from companyListOptions collection
		const listOptions = this.getNodeParameter('companyListOptions', 0, {});
		
		// Map parameters
		const params = mapListCompaniesParams.call(this, listOptions);
		
		// Convert params to query string for consistency with other operations
		const queryString = Object.entries(params)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
			.join('&');
		
		// Get API URL
		const baseUrl = await getApiUrl.call(this, ApiType.PARTNER, 'companies');
		const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		
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
		
		console.log('[listCompanies] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[listCompanies] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[listCompanies] Error:', error);
		throw error;
	}
}
