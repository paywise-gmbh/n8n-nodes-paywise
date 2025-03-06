import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';

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
	console.log('[releaseClaim] operation function called');
	
	try {
		// Map parameters
		const { claimId } = mapReleaseClaimParams.call(this);
		console.log('[releaseClaim] Parameters mapped:', { claimId });
		
		// Make the API request directly
		console.log('[releaseClaim] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		const options = {
			method: 'PATCH',
			url: `${credentials.baseUrl}/claims/${claimId}/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: {
				submission_state: 'released',
			},
		};
		
		console.log('[releaseClaim] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[releaseClaim] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[releaseClaim] Error:', error);
		throw error;
	}
} 