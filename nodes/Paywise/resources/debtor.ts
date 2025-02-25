import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { IResourceFunctions, IResourceDescription } from '../interfaces';

interface IAddress {
	street: string;
	zip: string;
	city: string;
	country: string;
}

interface ICommunicationChannel {
	type: string;
	value: string;
}

interface IBankAccount {
	iban: string;
	bic?: string;
}

interface IPerson {
	salutation?: string;
	first_name: string;
	last_name: string;
	birth_date?: string;
}

interface IOrganization {
	name: string;
}

interface IDebtorData {
	your_reference: string;
	acting_as: string;
	addresses: IAddress[];
	communication_channels: ICommunicationChannel[];
	bank_accounts: IBankAccount[];
	person?: IPerson;
	organization?: IOrganization;
}

export const debtorDescription: IResourceDescription = {
	operations: [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['debtor'],
				},
			},
			options: [
				{
					name: 'Create',
					value: 'createDebtor',
					description: 'Create a new debtor',
					action: 'Create a new debtor',
				},
				{
					name: 'Get',
					value: 'getDebtor',
					description: 'Retrieve a debtor',
					action: 'Get a debtor',
				},
				{
					name: 'List',
					value: 'listDebtors',
					description: 'List all debtors',
					action: 'List all debtors',
				},
			],
			default: 'listDebtors',
		},
	],
	properties: [
		{
			displayName: 'Input Type',
			name: 'inputType',
			type: 'options',
			options: [
				{
					name: 'JSON',
					value: 'json',
					description: 'Input JSON object',
				},
				{
					name: 'Fields',
					value: 'fields',
					description: 'Input individual fields',
				},
			],
			default: 'fields',
			displayOptions: {
				show: {
					operation: ['createDebtor'],
				},
			},
			description: 'Whether to input data via fields or JSON object',
		},
		{
			displayName: 'JSON Data',
			name: 'jsonData',
			type: 'json',
			default: `{
  "your_reference": "MEMBER-ID-1413",
  "person": {
    "salutation": "Herr",
    "first_name": "Max",
    "last_name": "Mustermann",
    "birth_date": "1986-08-24"
  },
  "acting_as": "consumer",
  "addresses": [
    {
      "street": "Am Beispielbach 4",
      "zip": "80804",
      "city": "München",
      "country": "DE"
    }
  ],
  "communication_channels": [
    {
      "type": "email",
      "value": "max@mustermann.de"
    }
  ],
  "bank_accounts": [
    {
      "iban": "DE53500105178977267179",
      "bic": "BYLADEM1001"
    }
  ]
}`,
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['json'],
				},
			},
			description: 'Debtor data as JSON object',
		},
		// Basic Fields
		{
			displayName: 'Your Reference',
			name: 'your_reference',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
			description: 'Your reference for this debtor (max 255 characters)',
		},
		{
			displayName: 'Debtor Type',
			name: 'debtor_type',
			type: 'options',
			options: [
				{
					name: 'Person',
					value: 'person',
					description: 'Natural person or single-person-business',
				},
				{
					name: 'Organization',
					value: 'organization',
					description: 'Organization (no single-person-business)',
				},
			],
			default: 'person',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
		},
		// Person Fields
		{
			displayName: 'Salutation',
			name: 'salutation',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
					debtor_type: ['person'],
				},
			},
			description: 'Salutation (max 100 characters)',
		},
		{
			displayName: 'First Name',
			name: 'first_name',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
					debtor_type: ['person'],
				},
			},
			description: 'First name (max 255 characters)',
		},
		{
			displayName: 'Last Name',
			name: 'last_name',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
					debtor_type: ['person'],
				},
			},
			description: 'Last name (max 255 characters)',
		},
		{
			displayName: 'Birth Date',
			name: 'birth_date',
			type: 'string',
			default: '',
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
					debtor_type: ['person'],
				},
			},
			description: 'Birth date in YYYY-MM-DD format',
		},
		// Organization Fields
		{
			displayName: 'Organization Name',
			name: 'organization_name',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
					debtor_type: ['organization'],
				},
			},
			description: 'Organization name (max 255 characters)',
		},
		// Common Fields
		{
			displayName: 'Acting As',
			name: 'acting_as',
			type: 'options',
			options: [
				{
					name: 'Consumer',
					value: 'consumer',
					description: 'Verbraucher',
				},
				{
					name: 'Business',
					value: 'business',
					description: 'Unternehmer',
				},
			],
			default: 'consumer',
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
		},
		// Addresses
		{
			displayName: 'Addresses',
			name: 'addresses',
			placeholder: 'Add Address',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			required: true,
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'addressValues',
					displayName: 'Address',
					values: [
						{
							displayName: 'Street',
							name: 'street',
							type: 'string',
							default: '',
							required: true,
							description: 'Street name and number (max 255 characters)',
						},
						{
							displayName: 'ZIP',
							name: 'zip',
							type: 'string',
							default: '',
							required: true,
							description: 'ZIP/Postal code (max 100 characters)',
						},
						{
							displayName: 'City',
							name: 'city',
							type: 'string',
							default: '',
							required: true,
							description: 'City name (max 100 characters)',
						},
						{
							displayName: 'Country',
							name: 'country',
							type: 'string',
							typeOptions: {
								alwaysOpenEditForm: true,
							},
							default: 'DE',
							required: true,
							description: 'Country code (ISO-3166-1 alpha-2)',
							hint: 'Common codes: DE (Germany), AT (Austria), CH (Switzerland)',
						},
					],
				},
			],
		},
		// Communication Channels
		{
			displayName: 'Communication Channels',
			name: 'communication_channels',
			placeholder: 'Add Communication Channel',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'channelValues',
					displayName: 'Channel',
					values: [
						{
							displayName: 'Type',
							name: 'type',
							type: 'options',
							options: [
								{ name: 'Email', value: 'email' },
								{ name: 'Phone', value: 'phone' },
								{ name: 'Mobile Phone', value: 'mobile_phone' },
								{ name: 'Fax', value: 'fax' },
								{ name: 'Skype', value: 'skype' },
								{ name: 'Facebook Messenger', value: 'facebook_messenger' },
								{ name: 'iMessage', value: 'imessage' },
								{ name: 'WhatsApp', value: 'whatsapp' },
								{ name: 'Facebook', value: 'facebook' },
								{ name: 'Twitter', value: 'twitter' },
								{ name: 'LinkedIn', value: 'linkedin' },
								{ name: 'Xing', value: 'xing' },
								{ name: 'Other Social Media', value: 'social_various' },
								{ name: 'Website URL', value: 'website_url' },
								{ name: 'Other Web Source', value: 'web_various' },
							],
							default: 'email',
							required: true,
						},
						{
							displayName: 'Value',
							name: 'value',
							type: 'string',
							default: '',
							required: true,
							description: 'Value for the communication channel (1-255 characters)',
						},
					],
				},
			],
		},
		// Bank Accounts
		{
			displayName: 'Bank Accounts',
			name: 'bank_accounts',
			placeholder: 'Add Bank Account',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createDebtor'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'accountValues',
					displayName: 'Account',
					values: [
						{
							displayName: 'IBAN',
							name: 'iban',
							type: 'string',
							default: '',
							required: true,
							description: 'International Bank Account Number (1-34 characters)',
						},
						{
							displayName: 'BIC',
							name: 'bic',
							type: 'string',
							default: '',
							description: 'Bank Identifier Code (max 255 characters)',
						},
					],
				},
			],
		},
		// Get Debtor Properties
		{
			displayName: 'Debtor ID',
			name: 'debtorId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['getDebtor'],
					resource: ['debtor'],
				},
			},
			description: 'ID of the debtor to retrieve',
		},
		// List Debtors Properties
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 10,
			required: false,
			displayOptions: {
				show: {
					operation: ['listDebtors'],
					resource: ['debtor'],
				},
			},
			description: 'Number of debtors to return',
		},
		{
			displayName: 'Offset',
			name: 'offset',
			type: 'number',
			default: 0,
			required: false,
			displayOptions: {
				show: {
					operation: ['listDebtors'],
					resource: ['debtor'],
				},
			},
			description: 'Number of debtors to skip',
		},
	],
};

export const debtorOperations: IResourceFunctions = {
	async createDebtor(this: IExecuteFunctions): Promise<JsonObject> {
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let debtorData: IDebtorData;

		if (inputType === 'json') {
			debtorData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
			const debtorType = this.getNodeParameter('debtor_type', 0) as string;
			const yourReference = this.getNodeParameter('your_reference', 0) as string;
			const actingAs = this.getNodeParameter('acting_as', 0) as string;

			// Get addresses
			const addressesCollection = this.getNodeParameter('addresses', 0) as {
				addressValues: Array<{
					street: string;
					zip: string;
					city: string;
					country: string;
				}>;
			};

			const addresses = (addressesCollection.addressValues || []).map((addr) => ({
				street: addr.street,
				zip: addr.zip,
				city: addr.city,
				country: addr.country,
			}));

			// Get communication channels
			const channelsCollection = this.getNodeParameter('communication_channels', 0, { channelValues: [] }) as {
				channelValues: Array<{
					type: string;
					value: string;
				}>;
			};

			const communicationChannels = (channelsCollection.channelValues || []).map((channel) => ({
				type: channel.type,
				value: channel.value,
			}));

			// Get bank accounts
			const accountsCollection = this.getNodeParameter('bank_accounts', 0, { accountValues: [] }) as {
				accountValues: Array<{
					iban: string;
					bic: string;
				}>;
			};

			const bankAccounts = (accountsCollection.accountValues || []).map((account) => ({
				iban: account.iban,
				bic: account.bic || undefined,
			}));

			debtorData = {
				your_reference: yourReference,
				acting_as: actingAs,
				addresses,
				communication_channels: communicationChannels,
				bank_accounts: bankAccounts,
			};

			if (debtorType === 'person') {
				const birthDate = this.getNodeParameter('birth_date', 0, '') as string;
				debtorData.person = {
					salutation: this.getNodeParameter('salutation', 0, null) as string,
					first_name: this.getNodeParameter('first_name', 0) as string,
					last_name: this.getNodeParameter('last_name', 0) as string,
					birth_date: birthDate ? birthDate.split('T')[0] : undefined,
				};
			} else {
				debtorData.organization = {
					name: this.getNodeParameter('organization_name', 0) as string,
				};
			}
		}

		const credentials = await this.getCredentials('paywiseApi');
		const options = {
			method: 'POST',
			url: `${credentials.baseUrl}/debtors/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(debtorData),
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		return JSON.parse(response);
	},

	async getDebtor(this: IExecuteFunctions): Promise<JsonObject> {
		const debtorId = this.getNodeParameter('debtorId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
		const options = {
			method: 'GET',
			url: `${credentials.baseUrl}/debtors/${debtorId}/`,
			headers: {
				'Accept': 'application/json',
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		return JSON.parse(response);
	},

	async listDebtors(this: IExecuteFunctions): Promise<JsonObject> {
		const limit = this.getNodeParameter('limit', 0, 10) as number;
		const offset = this.getNodeParameter('offset', 0, 0) as number;
		const credentials = await this.getCredentials('paywiseApi');

		const options = {
			method: 'GET',
			url: `${credentials.baseUrl}/debtors/`,
			headers: {
				'Accept': 'application/json',
			},
			qs: {
				limit,
				offset,
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		return JSON.parse(response);
	},
}; 