import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addActOnBehalfOfClientHeader } from '../../../apiUtils';

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
 * Maps node parameters for getClaim operation
 */
export function mapGetClaimParams(this: IExecuteFunctions): { claimId: string; actOnBehalfOfClient: boolean; userId?: string } {
	const claimId = this.getNodeParameter('claimId', 0) as string;
	const actOnBehalfOfClient = this.getNodeParameter('actOnBehalfOfClient', 0, false) as boolean;
	
	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Claim ID is required');
	}
	
	const params: { claimId: string; actOnBehalfOfClient: boolean; userId?: string } = {
		claimId,
		actOnBehalfOfClient,
	};
	
	if (actOnBehalfOfClient) {
		params.userId = this.getNodeParameter('userId', 0) as string;
		
		if (!params.userId) {
			throw new NodeOperationError(this.getNode(), 'User ID is required when acting on behalf of a client');
		}
	}
	
	return params;
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
		
		// Prepare headers
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		// Add X-User-Id header if acting on behalf of client
		const optionsWithHeaders = addActOnBehalfOfClientHeader.call(this, options, 0);
		
		console.log('[getClaim] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[getClaim] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getClaim] Error:', error);
		throw error;
	}
} 