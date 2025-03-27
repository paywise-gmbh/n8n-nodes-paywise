import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const listClaimsFields: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		required: false,
		description: 'Number of claims to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		required: false,
		description: 'Number of claims to skip',
	},
];

/**
 * Maps node parameters for listClaims operation
 */
export function mapListClaimsParams(this: IExecuteFunctions): { limit: number; offset: number } {
	console.log('[listClaims] mapListClaimsParams called');
	
	const limit = this.getNodeParameter('limit', 0, 10) as number;
	const offset = this.getNodeParameter('offset', 0, 0) as number;
	
	console.log('[listClaims] parameters mapped:', { limit, offset });
	return { limit, offset };
}

export async function listClaims(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[listClaims] operation function called');
	
	try {
		// Map parameters
		const { limit, offset } = mapListClaimsParams.call(this);
		
		// Convert parameters to query string
		const queryString = `limit=${limit}&offset=${offset}`;
		
		// Get API URL using the getApiUrl function
		const baseUrl = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims');
		const url = `${baseUrl}?${queryString}`;
		
		console.log('[listClaims] Using URL:', url);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[listClaims] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[listClaims] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[listClaims] Error:', error);
		throw error;
	}
} 