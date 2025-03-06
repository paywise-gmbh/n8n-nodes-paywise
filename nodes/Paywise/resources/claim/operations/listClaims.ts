import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

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
		
		// Make the API request directly like getInfo does
		console.log('[listClaims] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		console.log('[listClaims] Credentials retrieved:', {
			baseUrl: credentials.baseUrl,
			hasCredentials: !!credentials
		});
		
		// Use the same approach as getInfo instead of PaywiseClient
		const options = {
			method: 'GET',
			url: `${credentials.baseUrl}/claims/`,
			headers: {
				'Accept': 'application/json',
			},
			qs: {
				limit,
				offset,
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