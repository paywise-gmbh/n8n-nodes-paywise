import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

// Define operation field properties
export const releaseClaimFields: INodeProperties[] = [
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the claim to release',
	},
];

/**
 * Maps node parameters for releaseClaim operation
 */
export function mapReleaseClaimParams(this: IExecuteFunctions): { claimId: string } {
	const claimId = this.getNodeParameter('claimId', 0) as string;
	
	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Claim ID is required');
	}
	
	return { claimId };
}

export async function releaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
	// Map parameters
	const { claimId } = mapReleaseClaimParams.call(this);
	
	// Use PaywiseClient to release the claim
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	return client.releaseClaim(claimId);
} 