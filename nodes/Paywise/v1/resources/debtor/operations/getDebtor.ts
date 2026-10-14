import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addCommonHeaders,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

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
	try {
		// Map parameters
		const { debtorId } = mapGetDebtorParams.call(this);

		// Get API URL using the getApiUrl function
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'debtors', debtorId);

		// Prepare request options
		const options = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
