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
	const limit = this.getNodeParameter('limit', 0, 10) as number;
	const offset = this.getNodeParameter('offset', 0, 0) as number;
	
	return { limit, offset };
}

export async function listClaims(this: IExecuteFunctions): Promise<JsonObject> {
	// Map parameters
	const { limit, offset } = mapListClaimsParams.call(this);
	
	// Use PaywiseClient to list claims
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	return client.listClaims(limit, offset);
} 