import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties, INodeParameters } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';

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
	console.log('[getCompany] operation function called');
	
	try {
		// Get company ID from parameters
		const companyId = this.getNodeParameter('companyId', 0) as string;
		
		if (!companyId) {
			throw new Error('Company ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'companies',
			companyId,
		);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		
		console.log('[getCompany] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[getCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getCompany] Error:', error);
		throw error;
	}
}
