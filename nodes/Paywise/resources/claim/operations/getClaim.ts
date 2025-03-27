import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
	console.log('[getClaim] operation function called');
	
	try {
		// Map parameters
		const { claimId } = mapGetClaimParams.call(this);
		console.log('[getClaim] Parameters mapped:', { claimId });
		
		// Get API URL using the getApiUrl function
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims', claimId);
		
		console.log('[getClaim] Using URL:', url);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getClaim] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getClaim] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getClaim] Error:', error);
		throw error;
	}
} 