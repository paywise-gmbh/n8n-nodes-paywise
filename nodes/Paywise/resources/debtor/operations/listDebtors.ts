import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

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
		
		// Make the API request directly like getInfo does
		console.log('[listDebtors] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		console.log('[listDebtors] Credentials retrieved:', {
			baseUrl: credentials.baseUrl,
			hasCredentials: !!credentials
		});
		
		// Use the same approach as getInfo instead of PaywiseClient
		const options = {
			method: 'GET',
			url: `${credentials.baseUrl}/debtors/`,
			headers: {
				'Accept': 'application/json',
			},
			qs: {
				limit,
				offset,
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