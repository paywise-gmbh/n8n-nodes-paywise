import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
		const companyParams = this.getNodeParameter('companyParams', 0, {});
		
		if (!companyParams.companyId) {
			throw new Error('Company ID is required');
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'companies',
			companyParams.companyId as string,
		);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getCompany] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getCompany] Error:', error);
		throw error;
	}
} 