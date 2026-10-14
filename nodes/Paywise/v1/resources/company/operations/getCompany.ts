import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties
export const getCompanyFields: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		description: 'The ID of the company to retrieve',
	},
];

export async function getCompany(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get company ID from parameters
		const companyId = this.getNodeParameter('companyId', 0) as string;

		if (!companyId) {
			throw new NodeOperationError(this.getNode(), 'Company ID is required');
		}

		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'companies', companyId);

		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
