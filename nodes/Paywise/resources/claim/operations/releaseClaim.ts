import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addActOnBehalfOfClientHeader } from '../../../apiUtils';

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
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description: 'Whether to act on behalf of a client company when making this request',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'ID of the user to act on behalf of',
		required: true,
		displayOptions: {
			show: {
				actOnBehalfOfClient: [true],
			},
		},
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
		
		// Prepare request options
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
		
		// Add X-User-Id header if acting on behalf of client
		const optionsWithHeaders = addActOnBehalfOfClientHeader.call(this, options, 0);
		
		console.log('[releaseClaim] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[releaseClaim] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[releaseClaim] Error:', error);
		throw error;
	}
} 