import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl, addUserAgentHeader } from '../../../apiUtils';
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
				description: 'Phone number of the company (max 50 characters)',
			},
			{
				displayName: 'VAT Number',
				name: 'vat_number',
				type: 'string',
				default: '',
				description: 'VAT ID (Umsatzsteuer-Identifikationsnummer), must adhere to the German schema for VAT IDs',
			},
			{
				displayName: 'Legal Form',
				name: 'legal_form',
				type: 'string',
				default: '',
				description: 'Legal Form of the company',
			},
			{
				displayName: 'Tax Deduction Eligibility',
				name: 'tax_deduction_eligibility',
				type: 'options',
				options: [
					{
						name: 'Eligible (Vorsteuerabzugsberechtigt)',
						value: 'J',
					},
					{
						name: 'Not Eligible (Nicht vorsteuerabzugsberechtigt)',
						value: 'N',
					},
					{
						name: 'Reverse-Charge-Verfahren',
						value: 'K',
					},
					{
						name: 'Nicht steuerbare Umsätze - Drittlandunternehmer',
						value: 'A',
					},
				],
				default: 'J',
				description: 'The company\'s input tax deduction eligibility (Vorsteuerabzugsberechtigung)',
			},
			{
				displayName: 'Default Claim Type',
				name: 'default_claim_type',
				type: 'options',
				options: [
					{ name: 'Dienstleistungsvertrag', value: 'H05' },
					{ name: 'Warenlieferung/-en', value: 'H43' },
					{ name: 'Mitgliedsbeitrag', value: 'H22' },
					{ name: 'Miete', value: 'H21' },
					{ name: 'Kaufvertrag', value: 'H11' },
					{ name: 'Werkvertrag/Werklieferungsvertrag', value: 'H44' },
					{ name: 'Handwerkerleistung', value: 'H08' },
					{ name: 'Versicherungsprämie/-beitrag', value: 'H41' },
					{ name: 'Lehrgangs-/Unterrichtskosten', value: 'H16' },
					{ name: 'Hotelkosten', value: 'H10' },
					{ name: 'Ärztliche oder zahnärztliche Leistung', value: 'H02' },
					{ name: 'Schadenersatz aus Vertrag', value: 'H28' },
					{ name: 'Reparaturleistung', value: 'H26' },
					{ name: 'Rechtsanwalts-/Rechtsbeistandshonorar', value: 'H24' },
					{ name: 'Frachtkosten', value: 'H06' },
					{ name: 'Miete für Kraftfahrzeug', value: 'H18' },
					{ name: 'Speditionskosten', value: 'H34' },
					{ name: 'Miete für Wohnraum einschl. Nebenkosten', value: 'H19' },
					{ name: 'Versorgungsleistung - Strom, Wasser, Gas, Wärme-', value: 'H42' },
					{ name: 'Miete für Geschäftsraum einschl. Nebenkosten', value: 'H17' },
					{ name: 'Zeitungs-/Zeitschriftenbezug', value: 'H45' },
					{ name: 'Ungerechtfertigte Bereicherung', value: 'H37' },
					{ name: 'Schadenersatz aus Unfall/Vorfall', value: 'H29' },
					{ name: 'Anzeigen in Zeitungen u.a.', value: 'H01' },
					{ name: 'Tierärztliche Leistung', value: 'H78' },
					{ name: 'Lagerkosten', value: 'H14' },
					{ name: 'Krankentransportkosten', value: 'H77' },
					{ name: 'Vermittlungs-/Maklerprovision', value: 'H40' },
					{ name: 'Leasing/Mietkauf', value: 'H15' },
					{ name: 'Pacht', value: 'H23' },
					{ name: 'Darlehensrückzahlung', value: 'H04' },
					{ name: 'Mietnebenkosten - auch Renovierungskosten-', value: 'H20' },
					{ name: 'Verpflegungskosten', value: 'H79' },
					{ name: 'Reisevertrag', value: 'H75' },
					{ name: 'Schuldanerkenntnis', value: 'H33' },
					{ name: 'Vergleich, außergerichtlicher', value: 'H39' },
					{ name: 'Kindertagesstättenbeitrag', value: 'H70' },
					{ name: 'Wohngeld/Hausgeld für Wohnungseigentümergemeinschaft', value: 'H90' },
					{ name: 'Heimunterbringung', value: 'H09' },
					{ name: 'Bürgschaft', value: 'H03' },
					{ name: 'Geschäftsbesorgung durch Selbständige', value: 'H07' },
					{ name: 'Kontokorrentabrechnung', value: 'H12' },
					{ name: 'Krankenhauskosten-Pflege/Behandlung', value: 'H13' },
					{ name: 'Überziehung des Bankkontos', value: 'H36' },
					{ name: 'Wahlleistungen bei stationärer Behandlung', value: 'H61' },
					{ name: 'Telekommunikationsleistungen', value: 'H76' },
				],
				default: '',
				description: 'The company\'s default claim type (Vertragsart/Forderungsart)',
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				description: 'The company\'s payout account to which collected funds will be transferred',
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
								options: [
									{ name: 'Email', value: 'EMAIL' },
								],
								default: 'EMAIL',
								description: 'Type of notification channel. Currently only EMAIL is supported by the API.',
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
									{ name: 'Requests to Client', value: 'REQUESTS_TO_CLIENT' },
									{ name: 'Statements', value: 'STATEMENTS' },
								],
								default: ['STATUS_UPDATE'],
								description: 'Types of notifications to send through this channel',
							},
						],
					},
				],
			},
		],
	},
];

export async function updateCompany(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[updateCompany] operation function called');
	
	try {
		// Get company ID
		const companyId = this.getNodeParameter('companyId', 0) as string;
		
		if (!companyId) {
			throw new Error('Company ID is required');
		}
		
		// Determine input method
		const inputMethod = this.getNodeParameter('inputMethod', 0) as string;
		let updateData: Partial<ICompanyData> = {};
		
		if (inputMethod === 'json') {
			// Get data from JSON input
			const jsonString = this.getNodeParameter('jsonData', 0) as string;
			
			try {
				updateData = JSON.parse(jsonString) as Partial<ICompanyData>;
			} catch (e: any) {
				throw new Error('Invalid JSON: ' + e.message);
			}
		} else {
			// Get update fields from form input
			const updateFields = this.getNodeParameter('updateFields', 0, {}) as JsonObject;
			
			// Copy non-empty update fields to request data
			Object.entries(updateFields).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					// Handle nested objects and arrays
					if (key === 'address' && typeof value === 'object') {
						updateData.address = {} as any;
						Object.entries(value as JsonObject).forEach(([addressKey, addressValue]) => {
							if (addressValue !== undefined && addressValue !== null && addressValue !== '') {
								(updateData.address as any)[addressKey] = addressValue;
							}
						});
					} else if (key === 'legal_representatives' && typeof value === 'object' && 'representatives' in value) {
						updateData.legal_representatives = ((value as JsonObject).representatives as Array<any>).map(rep => ({
							type: rep.type,
							name: rep.name,
						}));
					} else if (key === 'notification_channels' && typeof value === 'object' && 'channels' in value) {
						updateData.notification_channels = ((value as JsonObject).channels as Array<any>).map(channel => ({
							channel_type: channel.channel_type,
							value: channel.value,
							notification_types: channel.notification_types,
						}));
					} else {
						(updateData as any)[key] = value;
					}
				}
			});
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
			method: 'PATCH',
			url,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updateData),
		};
		
		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		
		console.log('[updateCompany] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[updateCompany] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[updateCompany] Error:', error);
		throw error;
	}
}
