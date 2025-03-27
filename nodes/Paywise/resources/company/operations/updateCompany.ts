import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { ICompanyData } from '../company.interfaces';

// Define operation field properties
export const updateCompanyFields: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the company to update',
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Company name',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Company phone number',
			},
			{
				displayName: 'VAT Number',
				name: 'vat_number',
				type: 'string',
				default: '',
				description: 'Company VAT ID (required if tax_deduction_eligibility is "K")',
			},
			{
				displayName: 'Data Submission Completed',
				name: 'data_submission_completed',
				type: 'boolean',
				default: false,
				description: 'Whether the company data submission is completed',
			},
			{
				displayName: 'Tax Deduction Eligibility',
				name: 'tax_deduction_eligibility',
				type: 'options',
				options: [
					{
						name: 'Eligible',
						value: 'J',
					},
					{
						name: 'Not Eligible',
						value: 'K',
					},
				],
				default: 'J',
				description: 'Whether the company is eligible for tax deduction',
			},
			{
				displayName: 'Default Claim Type',
				name: 'default_claim_type',
				type: 'string',
				default: '',
				description: 'Default claim type for the company',
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				description: 'Company\'s payout account IBAN',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'collection',
				placeholder: 'Add Address Details',
				default: {},
				options: [
					{
						displayName: 'Street',
						name: 'street',
						type: 'string',
						default: '',
					},
					{
						displayName: 'ZIP Code',
						name: 'zip',
						type: 'string',
						default: '',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'string',
						default: 'DE',
					},
				],
			},
		],
	},
];

export async function updateCompany(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[updateCompany] operation function called');
	
	try {
		// Get company ID and update fields from parameters
		const companyParams = this.getNodeParameter('companyParams', 0, {});
		const updateFields = this.getNodeParameter('updateFields', 0, {}) as Partial<ICompanyData>;
		
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
		
		// Build request data from update fields
		const requestData: Partial<ICompanyData> = {};
		
		// Copy non-empty update fields to request data
		Object.entries(updateFields).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				requestData[key as keyof ICompanyData] = value;
			}
		});
		
		// Make API request
		const options = {
			method: 'PATCH',
			url,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestData),
		};
		
		console.log('[updateCompany] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[updateCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[updateCompany] Error:', error);
		throw error;
	}
} 