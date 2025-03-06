import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

// Define operation field properties
export const getClaimFields: INodeProperties[] = [
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the claim to retrieve',
	},
];

/**
 * Maps node parameters for getClaim operation
 */
export function mapGetClaimParams(this: IExecuteFunctions): { claimId: string } {
	const claimId = this.getNodeParameter('claimId', 0) as string;
	
	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Claim ID is required');
	}
	
	return { claimId };
}

export async function getClaim(this: IExecuteFunctions): Promise<JsonObject> {
	// Map parameters
	const { claimId } = mapGetClaimParams.call(this);
	
	// Use PaywiseClient to get the claim
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	return client.getClaim(claimId);
} 