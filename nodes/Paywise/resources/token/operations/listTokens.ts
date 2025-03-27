import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const listTokensFields: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		options: [
			{
				displayName: 'Company ID',
				name: 'company_id',
				type: 'string',
				default: '',
				description: 'Filter tokens by company ID',
			},
			{
				displayName: 'Token ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by token ID',
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

function mapListTokensParams(this: IExecuteFunctions, options: any) {
	const filters = options.filters || {};
	const limit = options.limit || 10;
	const offset = options.offset || 0;
	
	const params: Record<string, string | number> = {
		limit,
		offset,
	};
	
	// Add filters if present
	if (filters.company_id) {
		params.company_id = filters.company_id;
	}
	
	if (filters.id) {
		params.id = filters.id;
	}
	
	console.log('[listTokens] Mapped parameters:', params);
	return params;
}

export async function listTokens(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[listTokens] operation function called');
	
	try {
		// Get parameters from tokenListOptions collection
		const listOptions = this.getNodeParameter('tokenListOptions', 0, {});
		
		// Get and process parameters
		const queryParams = mapListTokensParams.call(this, listOptions);
		const queryString = Object.entries(queryParams)
			.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
			.join('&');
		
		// Get API URL
		const baseUrl = await getApiUrl.call(this, ApiType.PARTNER, 'tokens');
		const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[listTokens] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[listTokens] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[listTokens] Error:', error);
		throw error;
	}
} 