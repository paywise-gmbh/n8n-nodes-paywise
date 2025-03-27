import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
		
		// Get API URL using the getApiUrl function
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims', claimId);
		
		console.log('[releaseClaim] Using URL:', url);
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			// JSON body for release action
			body: JSON.stringify({
				status: 'release',
			}),
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