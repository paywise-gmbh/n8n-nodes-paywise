import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';
import { ICompanyData } from '../company.interfaces';

// Define operation field properties
export const updateCompanyFields: INodeProperties[] = [
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
		description: 'Method to use for updating company',
		required: true,
	},
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		required: true,
		description: 'The ID of the company to update',
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
		description: 'Company data as JSON object',
		hint: `Example: {
  "name": "Updated Company Name",
  "phone": "+491234567890",
  "address": {
    "street": "Example Street 123",
    "zip": "12345",
    "city": "Berlin",
    "country": "DE"
  },
  "vat_number": "DE123456789",
  "default_claim_type": "H05",
  "legal_form": "GmbH",
  "tax_deduction_eligibility": "J",
  "notification_channels": [
    {
      "channel_type": "EMAIL",
      "value": "notifications@example.com",
      "notification_types": ["STATUS_UPDATE", "REQUESTS_TO_CLIENT", "STATEMENTS"]
    }
  ],
  "iban": "DE89370400440532013000"
}`,
	},
	// Update fields - shown only when using fields input method
	{
		displayName: 'Update Fields',
		name: 'updateFields',
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
						description: 'Street and house number',
					},
					{
						displayName: 'ZIP Code',
						name: 'zip',
						type: 'string',
						default: '',
						description: 'Postal code',
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
						type: 'string',
						default: 'DE',
						description: 'Country code (ISO 3166-1 alpha-2)',
					},
				],
			},
			{
				displayName: 'Default Claim Type',
				name: 'default_claim_type',
				type: 'options',
				options: [
					{ name: 'Acknowledgment of Debt', value: 'H33' },
					{ name: 'Advertisements in Newspapers Etc.', value: 'H01' },
					{ name: 'Agency Services by Self-Employed Persons', value: 'H07' },
					{ name: 'Bank Account Overdraft', value: 'H36' },
					{ name: 'Brokerage/Agency Commission', value: 'H40' },
					{ name: 'Care Home Accommodation', value: 'H09' },
					{ name: 'Catering Costs', value: 'H79' },
					{ name: 'Contract for Work and Materials', value: 'H44' },
					{ name: 'Course/Tuition Fees', value: 'H16' },
					{ name: 'Craftsman Services', value: 'H08' },
					{ name: 'Current Account Statement', value: 'H12' },
					{ name: 'Damages From Accident/Incident', value: 'H29' },
					{ name: 'Damages From Contract', value: 'H28' },
					{ name: 'Daycare Fees', value: 'H70' },
					{ name: 'Delivery of Goods', value: 'H43' },
					{ name: 'Forwarding Costs', value: 'H34' },
					{ name: 'Freight Costs', value: 'H06' },
					{ name: 'Guarantee', value: 'H03' },
					{ name: 'Homeowners Association Fees', value: 'H90' },
					{ name: 'Hospital Costs (Care/Treatment)', value: 'H13' },
					{ name: 'Hotel Costs', value: 'H10' },
					{ name: 'Insurance Premium/Contribution', value: 'H41' },
					{ name: 'Lawyer/Legal Adviser Fees', value: 'H24' },
					{ name: 'Lease (Land or Business)', value: 'H23' },
					{ name: 'Leasing/Hire Purchase', value: 'H15' },
					{ name: 'Loan Repayment', value: 'H04' },
					{ name: 'Medical or Dental Services', value: 'H02' },
					{ name: 'Membership Fee', value: 'H22' },
					{ name: 'Newspaper/Magazine Subscription', value: 'H45' },
					{ name: 'Optional Services During Inpatient Treatment', value: 'H61' },
					{ name: 'Out-of-Court Settlement', value: 'H39' },
					{ name: 'Patient Transport Costs', value: 'H77' },
					{ name: 'Purchase Contract', value: 'H11' },
					{ name: 'Rent', value: 'H21' },
					{ name: 'Rent for Business Premises Incl. Service Charges', value: 'H17' },
					{ name: 'Rent for Residential Space Incl. Service Charges', value: 'H19' },
					{ name: 'Repair Services', value: 'H26' },
					{ name: 'Service Charges (Incl. Renovation Costs)', value: 'H20' },
					{ name: 'Service Contract', value: 'H05' },
					{ name: 'Storage Costs', value: 'H14' },
					{ name: 'Telecommunication Services', value: 'H76' },
					{ name: 'Travel Contract', value: 'H75' },
					{ name: 'Unjust Enrichment', value: 'H37' },
					{ name: 'Utilities (Electricity, Water, Gas, Heating)', value: 'H42' },
					{ name: 'Vehicle Rental', value: 'H18' },
					{ name: 'Veterinary Services', value: 'H78' },
				],
				default: 'H05',
				description: "The company's default claim type",
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				description: "The company's payout account to which collected funds will be transferred",
			},
			{
				displayName: 'Legal Form',
				name: 'legal_form',
				type: 'string',
				default: '',
				description: 'Legal Form of the company',
			},
			{
				displayName: 'Legal Representatives',
				name: 'legal_representatives',
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
								type: 'string',
								default: '',
								description: 'Type of legal representative',
							},
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the legal representative',
							},
						],
					},
				],
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the company',
			},
			{
				displayName: 'Notification Channels',
				name: 'notification_channels',
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
								options: [{ name: 'Email', value: 'EMAIL' }],
								default: 'EMAIL',
								description:
									'Type of notification channel. Currently only EMAIL is supported by the API.',
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
									{ name: 'Requests to Client', value: 'REQUESTS_TO_CLIENT' },
									{ name: 'Statements', value: 'STATEMENTS' },
									{ name: 'Status Updates', value: 'STATUS_UPDATE' },
								],
								default: ['STATUS_UPDATE'],
								description: 'Types of notifications to send through this channel',
							},
						],
					},
				],
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Phone number of the company (max 50 characters)',
			},
			{
				displayName: 'Tax Deduction Eligibility',
				name: 'tax_deduction_eligibility',
				type: 'options',
				options: [
					{
						name: 'Eligible for Input Tax Deduction',
						value: 'J',
					},
					{
						name: 'Not Eligible for Input Tax Deduction',
						value: 'N',
					},
					{
						name: 'Reverse Charge',
						value: 'K',
					},
					{
						name: 'Third Country Business (Non-Taxable Sales)',
						value: 'A',
					},
				],
				default: 'J',
				description: "The company's input tax deduction eligibility",
			},
			{
				displayName: 'VAT Number',
				name: 'vat_number',
				type: 'string',
				default: '',
				description:
					'VAT ID (Umsatzsteuer-Identifikationsnummer), must adhere to the German schema for VAT IDs',
			},
		],
	},
];

export async function updateCompany(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get company ID
		const companyId = this.getNodeParameter('companyId', 0) as string;

		if (!companyId) {
			throw new NodeOperationError(this.getNode(), 'Company ID is required');
		}

		// Determine input method
		const inputMethod = this.getNodeParameter('inputMethod', 0) as string;
		let updateData: Partial<ICompanyData> = {};

		if (inputMethod === 'json') {
			// Get data from JSON input
			const jsonString = this.getNodeParameter('jsonData', 0) as string;

			try {
				updateData = JSON.parse(jsonString) as Partial<ICompanyData>;
			} catch (e) {
				throw new NodeOperationError(this.getNode(), 'Invalid JSON: ' + (e as Error).message);
			}
		} else {
			// Get update fields from form input
			const updateFields = this.getNodeParameter('updateFields', 0, {}) as JsonObject;

			// Copy non-empty update fields to request data
			Object.entries(updateFields).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					// Handle nested objects and arrays
					if (key === 'address' && typeof value === 'object') {
						updateData.address = {} as ICompanyData['address'];
						Object.entries(value as JsonObject).forEach(([addressKey, addressValue]) => {
							if (addressValue !== undefined && addressValue !== null && addressValue !== '') {
								(updateData.address as unknown as IDataObject)[addressKey] = addressValue;
							}
						});
					} else if (
						key === 'legal_representatives' &&
						typeof value === 'object' &&
						'representatives' in value
					) {
						updateData.legal_representatives = (
							(value as JsonObject).representatives as IDataObject[]
						).map((rep) => ({
							type: rep.type,
							name: rep.name,
						})) as ICompanyData['legal_representatives'];
					} else if (
						key === 'notification_channels' &&
						typeof value === 'object' &&
						'channels' in value
					) {
						updateData.notification_channels = (
							(value as JsonObject).channels as IDataObject[]
						).map((channel) => ({
							channel_type: channel.channel_type,
							value: channel.value,
							notification_types: channel.notification_types,
						})) as ICompanyData['notification_channels'];
					} else {
						(updateData as IDataObject)[key] = value;
					}
				}
			});
		}

		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'companies', companyId);

		// Make API request
		const options = {
			method: 'PATCH',
			url,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updateData),
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
