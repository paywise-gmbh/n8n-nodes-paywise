import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addCommonHeaders } from '../../../apiUtils';

// Define operation field properties
export const getDebtorFields: INodeProperties[] = [
	{
		displayName: 'Debtor ID',
		name: 'debtorId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the debtor to retrieve',
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
 * Maps node parameters for getDebtor operation
 */
export function mapGetDebtorParams(this: IExecuteFunctions): { debtorId: string } {
	const debtorId = this.getNodeParameter('debtorId', 0) as string;
	
	if (!debtorId) {
		throw new NodeOperationError(this.getNode(), 'Debtor ID is required');
	}
	
	return { debtorId };
}

export async function getDebtor(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[getDebtor] operation function called');
	
	try {
		// Map parameters
		const { debtorId } = mapGetDebtorParams.call(this);
		console.log('[getDebtor] Parameters mapped:', { debtorId });
		
		// Get API URL using the getApiUrl function
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'debtors', debtorId);
		
		console.log('[getDebtor] Using URL:', url);
		
		// Prepare request options
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
		
		console.log('[getDebtor] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[getDebtor] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getDebtor] Error:', error);
		throw error;
	}
}
