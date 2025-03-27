import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getDebtor] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getDebtor] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getDebtor] Error:', error);
		throw error;
	}
} 