import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { ICompanyData } from '../company.interfaces';

// Define operation field properties
export const createCompanyFields: INodeProperties[] = [
	// Basic company information
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description: 'Name of the company',
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		description: 'Phone number of the company',
	},
	{
		displayName: 'Legal Form',
		name: 'legal_form',
		type: 'string',
		default: '',
		description: 'Legal form of the company (e.g., GmbH, AG, etc.)',
	},
	{
		displayName: 'Tax Deduction Eligibility',
		name: 'tax_deduction_eligibility',
		type: 'options',
		options: [
			{
				name: 'Eligible (J)',
				value: 'J',
				description: 'Vorsteuerabzugsberechtigt',
			},
			{
				name: 'Not Eligible (N)',
				value: 'N',
				description: 'Nicht vorsteuerabzugsberechtigt',
			},
			{
				name: 'Reverse Charge (K)',
				value: 'K',
				description: 'Reverse-Charge-Verfahren',
			},
			{
				name: 'Third Country Business (A)',
				value: 'A',
				description: 'Nicht steuerbare Umsätze - Drittlandunternehmer',
			},
		],
		default: 'J',
		description: 'Tax deduction eligibility of the company',
	},
	// Address fields
	{
		displayName: 'Address',
		name: 'addressDetails',
		placeholder: 'Address Details',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		default: {},
		options: [
			{
				name: 'address',
				displayName: 'Address',
				values: [
					{
						displayName: 'Street and Number',
						name: 'street',
						type: 'string',
						default: '',
						description: 'Street name and house number',
					},
					{
						displayName: 'ZIP Code',
						name: 'zip',
						type: 'string',
						default: '',
						description: 'ZIP or postal code',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						description: 'City name',
					},
					{
						displayName: 'Country',
						name: 'country',
						type: 'options',
						options: [
							{ name: 'Germany', value: 'DE' },
							{ name: 'Austria', value: 'AT' },
							{ name: 'Switzerland', value: 'CH' },
							// Add more countries as needed
						],
						default: 'DE',
						description: 'Country code (ISO-3166-1)',
					},
				],
			},
		],
	},
	// Optional fields
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				displayName: 'VAT Number',
				name: 'vat_number',
				type: 'string',
				default: '',
				description: 'VAT identification number (mandatory if tax_deduction_eligibility is "K")',
			},
			{
				displayName: 'Default Claim Type',
				name: 'default_claim_type',
				type: 'options',
				options: [
					{ name: 'Service Contract (H05)', value: 'H05' },
					{ name: 'Goods Delivery (H43)', value: 'H43' },
					{ name: 'Membership Fee (H22)', value: 'H22' },
					{ name: 'Rent (H21)', value: 'H21' },
					// Add more claim types as needed
				],
				default: 'H05',
				description: 'Default claim type for the company',
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				description: 'Company\'s payout account IBAN',
			},
		],
	},
	// Legal representatives
	{
		displayName: 'Legal Representatives',
		name: 'legalRepresentatives',
		placeholder: 'Add Legal Representative',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				name: 'representatives',
				displayName: 'Representatives',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Gesellschafter', value: 'gesellschafter' },
							{ name: 'Geschäftsführer', value: 'geschaeftsführer' },
							{ name: 'Komplementär', value: 'komplementaer' },
							{ name: 'Inhaber', value: 'inhaber' },
							{ name: 'Vorstand', value: 'vorstand' },
							// Add more types as needed
						],
						default: 'geschaeftsführer',
						description: 'Type/role of the legal representative',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Full name of the legal representative',
					},
				],
			},
		],
	},
	// Notification channels
	{
		displayName: 'Notification Channels',
		name: 'notificationChannels',
		placeholder: 'Add Notification Channel',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				name: 'channels',
				displayName: 'Channels',
				values: [
					{
						displayName: 'Channel Type',
						name: 'channel_type',
						type: 'options',
						options: [
							{ name: 'Email', value: 'EMAIL' },
						],
						default: 'EMAIL',
						description: 'Type of notification channel',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Email address for notifications',
					},
					{
						displayName: 'Notification Types',
						name: 'notification_types',
						type: 'multiOptions',
						options: [
							{ name: 'Status Updates', value: 'STATUS_UPDATE' },
							{ name: 'Client Requests', value: 'REQUESTS_TO_CLIENT' },
							{ name: 'Statements', value: 'STATEMENTS' },
						],
						default: ['STATUS_UPDATE', 'REQUESTS_TO_CLIENT', 'STATEMENTS'],
						description: 'Types of notifications to receive',
					},
				],
			},
		],
	},
];

export async function createCompany(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createCompany] operation function called');
	
	try {
		// Get company data from parameters
		const companyData = this.getNodeParameter('companyData', 0, {});
		
		// Validate required fields
		if (!companyData.name) {
			throw new Error('Company name is required');
		}
		
		if (!companyData.phone) {
			throw new Error('Company phone is required');
		}
		
		if (!companyData.legal_form) {
			throw new Error('Company legal form is required');
		}
		
		if (!companyData.tax_deduction_eligibility) {
			throw new Error('Tax deduction eligibility is required');
		}
		
		// Verify required address information exists
		if (!companyData.addressDetails || !companyData.addressDetails.address) {
			throw new Error('Company address is required');
		}
		
		const addressData = companyData.addressDetails.address;
		
		// Validate address fields
		if (!addressData.street) {
			throw new Error('Street is required in company address');
		}
		
		if (!addressData.zip) {
			throw new Error('ZIP code is required in company address');
		}
		
		if (!addressData.city) {
			throw new Error('City is required in company address');
		}
		
		if (!addressData.country) {
			throw new Error('Country is required in company address');
		}
		
		// Build company data object with required address
		const company: ICompanyData = {
			name: companyData.name as string,
			phone: companyData.phone as string,
			legal_form: companyData.legal_form as string,
			tax_deduction_eligibility: companyData.tax_deduction_eligibility as string,
			address: {
				street: addressData.street as string,
				zip: addressData.zip as string,
				city: addressData.city as string,
				country: addressData.country as string,
			},
		};
		
		// Add optional fields
		if (companyData.additionalFields) {
			const additionalFields = companyData.additionalFields as JsonObject;
			
			if (additionalFields.vat_number) {
				company.vat_number = additionalFields.vat_number as string;
			}
			
			if (additionalFields.default_claim_type) {
				company.default_claim_type = additionalFields.default_claim_type as string;
			}
			
			if (additionalFields.iban) {
				company.iban = additionalFields.iban as string;
			}
		}
		
		// Add legal representatives
		if (companyData.legalRepresentatives && companyData.legalRepresentatives.representatives) {
			const representatives = companyData.legalRepresentatives.representatives as Array<{ type: string; name: string }>;
			company.legal_representatives = representatives.map(rep => ({
				type: rep.type,
				name: rep.name,
			}));
		}
		
		// Add notification channels
		if (companyData.notificationChannels && companyData.notificationChannels.channels) {
			const channels = companyData.notificationChannels.channels as Array<{
				channel_type: string;
				value: string;
				notification_types: string[];
			}>;
			
			company.notification_channels = channels.map(channel => ({
				channel_type: channel.channel_type,
				value: channel.value,
				notification_types: channel.notification_types,
			}));
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'companies');
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(company),
		};
		
		console.log('[createCompany] Making authenticated API request to:', url);
		console.log('[createCompany] Request body:', company);
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createCompany] Error:', error);
		throw error;
	}
} 