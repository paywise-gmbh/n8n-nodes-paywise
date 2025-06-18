import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';
import { ICompanyData } from '../company.interfaces';

// Define operation field properties
export const createCompanyFields: INodeProperties[] = [
	{
		displayName: 'Input Method',
		name: 'inputMethod',
		type: 'options',
		options: [
			{
				name: 'Form Fields',
				value: 'fields',
				description: 'Configure company using form fields',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Configure company using JSON',
			},
		],
		default: 'fields',
		description: 'Method to use for company creation',
	},
	{
		displayName: 'Company JSON',
		name: 'jsonData',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				inputMethod: ['json'],
			},
		},
		description: 'Company data as JSON object. Must include at minimum: name, phone, address, legal_form, and tax_deduction_eligibility',
		hint: `Example: {
  "name": "Example GmbH",
  "phone": "+49 123 456789",
  "legal_form": "GmbH",
  "tax_deduction_eligibility": "J",
  "address": {
    "street": "Example Street 123",
    "zip": "12345",
    "city": "Berlin",
    "country": "DE"
  }
}`,
	},
	// Basic company information - shown only when using fields input method
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'Name of the company',
	},
	{
		displayName: 'Phone',
		name: 'phone',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'Phone number of the company (max 50 characters)',
	},
	{
		displayName: 'Legal Form',
		name: 'legal_form',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
						required: true,
						description: 'Street name and house number',
					},
					{
						displayName: 'ZIP Code',
						name: 'zip',
						type: 'string',
						default: '',
						required: true,
						description: 'ZIP or postal code',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						default: '',
						required: true,
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
						required: true,
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
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
					{ name: 'Sales Contract (H11)', value: 'H11' },
					{ name: 'Contract for Work (H44)', value: 'H44' },
					{ name: 'Handcraft Service (H08)', value: 'H08' },
					{ name: 'Insurance Premium (H41)', value: 'H41' },
					{ name: 'Course/Training Costs (H16)', value: 'H16' },
					{ name: 'Hotel Costs (H10)', value: 'H10' },
					{ name: 'Medical/Dental Service (H02)', value: 'H02' },
					{ name: 'Contractual Compensation (H28)', value: 'H28' },
					{ name: 'Repair Service (H26)', value: 'H26' },
					{ name: 'Legal Fee (H24)', value: 'H24' },
					{ name: 'Freight Costs (H06)', value: 'H06' },
					{ name: 'Vehicle Rental (H18)', value: 'H18' },
					{ name: 'Shipping Costs (H34)', value: 'H34' },
					{ name: 'Residential Rent (H19)', value: 'H19' },
					{ name: 'Utility Service (H42)', value: 'H42' },
					{ name: 'Commercial Rent (H17)', value: 'H17' },
					{ name: 'Newspaper/Magazine Subscription (H45)', value: 'H45' },
					{ name: 'Unjust Enrichment (H37)', value: 'H37' },
					{ name: 'Accident Compensation (H29)', value: 'H29' },
					{ name: 'Newspaper Advertisement (H01)', value: 'H01' },
					{ name: 'Veterinary Service (H78)', value: 'H78' },
					{ name: 'Storage Costs (H14)', value: 'H14' },
					{ name: 'Patient Transport Costs (H77)', value: 'H77' },
					{ name: 'Broker Commission (H40)', value: 'H40' },
					{ name: 'Leasing (H15)', value: 'H15' },
					{ name: 'Lease (H23)', value: 'H23' },
					{ name: 'Loan Repayment (H04)', value: 'H04' },
					{ name: 'Rental Utilities (H20)', value: 'H20' },
					{ name: 'Catering Costs (H79)', value: 'H79' },
					{ name: 'Travel Contract (H75)', value: 'H75' },
					{ name: 'Acknowledgment of Debt (H33)', value: 'H33' },
					{ name: 'Out-of-court Settlement (H39)', value: 'H39' },
					{ name: 'Daycare Fee (H70)', value: 'H70' },
					{ name: 'Housing Association Fee (H90)', value: 'H90' },
					{ name: 'Nursing Home Care (H09)', value: 'H09' },
					{ name: 'Guarantee (H03)', value: 'H03' },
					{ name: 'Business Management (H07)', value: 'H07' },
					{ name: 'Current Account Settlement (H12)', value: 'H12' },
					{ name: 'Hospital Costs (H13)', value: 'H13' },
					{ name: 'Bank Account Overdraft (H36)', value: 'H36' },
					{ name: 'Hospital Special Services (H61)', value: 'H61' },
					{ name: 'Telecommunications (H76)', value: 'H76' },
				],
				default: 'H05',
				description: 'Default claim type for the company',
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				description: 'Company\'s payout account IBAN (max 32 characters)',
				placeholder: 'DE89370400440532013000',
			},
			{
				displayName: 'Data Submission Completed',
				name: 'data_submission_completed',
				type: 'boolean',
				default: false,
				description: 'Whether the company data submission is completed',
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
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
							{ name: 'Email', value: 'email' },
							{ name: 'SMS', value: 'sms' },
							// Add more channel types as needed
						],
						default: 'email',
						description: 'Type of notification channel',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Email address or phone number for notifications',
					},
					{
						displayName: 'Notification Types',
						name: 'notification_types',
						type: 'multiOptions',
						options: [
							{ name: 'Claim Created', value: 'claim_created' },
							{ name: 'Claim Paid', value: 'claim_paid' },
							{ name: 'Claim Status Changed', value: 'claim_status_changed' },
							// Add more notification types as needed
						],
						default: ['claim_status_changed'],
						description: 'Types of notifications to send through this channel',
					},
				],
			},
		],
	},
];

export async function createCompany(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createCompany] operation function called');
	
	try {
		// Determine input method
		const inputMethod = this.getNodeParameter('inputMethod', 0) as string;
		let company: ICompanyData;
		
		if (inputMethod === 'json') {
			// Get data from JSON input
			const jsonString = this.getNodeParameter('jsonData', 0) as string;
			
			try {
				company = JSON.parse(jsonString) as ICompanyData;
			} catch (e: any) {
				throw new Error('Invalid JSON: ' + e.message);
			}
			
			// Validate JSON input contains required fields
			if (!company.name) {
				throw new Error('Company name is required in JSON');
			}
			
			if (!company.phone) {
				throw new Error('Company phone is required in JSON');
			}
			
			if (!company.legal_form) {
				throw new Error('Company legal form is required in JSON');
			}
			
			if (!company.tax_deduction_eligibility) {
				throw new Error('Tax deduction eligibility is required in JSON');
			}
			
			if (!company.address) {
				throw new Error('Company address is required in JSON');
			}
			
			if (!company.address.street) {
				throw new Error('Street is required in company address JSON');
			}
			
			if (!company.address.zip) {
				throw new Error('ZIP code is required in company address JSON');
			}
			
			if (!company.address.city) {
				throw new Error('City is required in company address JSON');
			}
			
			if (!company.address.country) {
				throw new Error('Country is required in company address JSON');
			}
			
			// Tax deduction eligibility K requires VAT number
			if (company.tax_deduction_eligibility === 'K' && !company.vat_number) {
				throw new Error('VAT number is required when tax_deduction_eligibility is K');
			}
			
		} else {
			// Get company data from form fields
			const name = this.getNodeParameter('name', 0) as string;
			const phone = this.getNodeParameter('phone', 0) as string;
			const legal_form = this.getNodeParameter('legal_form', 0) as string;
			const tax_deduction_eligibility = this.getNodeParameter('tax_deduction_eligibility', 0) as string;
			
			// Get address details
			const addressDetails = this.getNodeParameter('addressDetails', 0, { address: {} }) as {
				address: {
					street: string;
					zip: string;
					city: string;
					country: string;
				}
			};
			
			// Verify required fields
			if (!name) {
				throw new Error('Company name is required');
			}
			
			if (!phone) {
				throw new Error('Company phone is required');
			}
			
			if (!legal_form) {
				throw new Error('Company legal form is required');
			}
			
			if (!tax_deduction_eligibility) {
				throw new Error('Tax deduction eligibility is required');
			}
			
			// Verify required address information exists
			if (!addressDetails || !addressDetails.address) {
				throw new Error('Company address is required');
			}
			
			const addressData = addressDetails.address;
			
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
			company = {
				name,
				phone,
				legal_form,
				tax_deduction_eligibility,
				address: {
					street: addressData.street,
					zip: addressData.zip,
					city: addressData.city,
					country: addressData.country,
				},
			};
			
			// Add optional fields
			const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as JsonObject;
			
			if (additionalFields.vat_number) {
				company.vat_number = additionalFields.vat_number as string;
			}
			
			if (additionalFields.default_claim_type) {
				company.default_claim_type = additionalFields.default_claim_type as string;
			}
			
			if (additionalFields.iban) {
				company.iban = additionalFields.iban as string;
			}
			
			if (additionalFields.data_submission_completed !== undefined) {
				company.data_submission_completed = additionalFields.data_submission_completed as boolean;
			}
			
			// Add legal representatives
			const legalRepresentatives = this.getNodeParameter('legalRepresentatives', 0, { representatives: [] }) as {
				representatives: Array<{ type: string; name: string }>;
			};
			
			if (legalRepresentatives && legalRepresentatives.representatives && legalRepresentatives.representatives.length > 0) {
				company.legal_representatives = legalRepresentatives.representatives.map(rep => ({
					type: rep.type,
					name: rep.name,
				}));
			}
			
			// Add notification channels
			const notificationChannels = this.getNodeParameter('notificationChannels', 0, { channels: [] }) as {
				channels: Array<{
					channel_type: string;
					value: string;
					notification_types: string[];
				}>;
			};
			
			if (notificationChannels && notificationChannels.channels && notificationChannels.channels.length > 0) {
				company.notification_channels = notificationChannels.channels.map(channel => ({
					channel_type: channel.channel_type,
					value: channel.value,
					notification_types: channel.notification_types,
				}));
			}
		}
		
		// Validate VAT number when tax deduction eligibility is K
		if (company.tax_deduction_eligibility === 'K' && !company.vat_number) {
			throw new Error('VAT number is required when tax_deduction_eligibility is K');
		}
		
		// Validate IBAN length
		if (company.iban && company.iban.length > 32) {
			throw new Error('IBAN must not exceed 32 characters');
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
		
		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		
		console.log('[createCompany] Making authenticated API request to:', url);
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[createCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createCompany] Error:', error);
		throw error;
	}
}
