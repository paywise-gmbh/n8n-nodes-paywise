import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

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
	// Map parameters
	const { debtorId } = mapGetDebtorParams.call(this);
	
	// Use PaywiseClient to get the debtor
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	return client.getDebtor(debtorId);
} 