import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

// Define operation field properties
export const listDebtorsFields: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		required: false,
		description: 'Number of debtors to return',
	},
	{
		displayName: 'Offset',
		name: 'offset',
		type: 'number',
		default: 0,
		required: false,
		description: 'Number of debtors to skip',
	},
];

/**
 * Maps node parameters for listDebtors operation
 */
export function mapListDebtorsParams(this: IExecuteFunctions): { limit: number; offset: number } {
	console.log('[listDebtors] mapListDebtorsParams called');
	
	const limit = this.getNodeParameter('limit', 0, 10) as number;
	const offset = this.getNodeParameter('offset', 0, 0) as number;
	
	console.log('[listDebtors] parameters mapped:', { limit, offset });
	return { limit, offset };
}

export async function listDebtors(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[listDebtors] operation function called');
	
	try {
		// Map parameters
		const { limit, offset } = mapListDebtorsParams.call(this);
		
		// Convert parameters to query string
		const queryString = `limit=${limit}&offset=${offset}`;
		
		// Get API URL using the getApiUrl function
		const baseUrl = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'debtors');
		const url = `${baseUrl}?${queryString}`;
		
		console.log('[listDebtors] Using URL:', url);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[listDebtors] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[listDebtors] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[listDebtors] Error:', error);
		throw error;
	}
} 