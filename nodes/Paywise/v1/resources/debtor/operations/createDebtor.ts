import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { IDebtorData, IAddress, ICommunicationChannel, IBankAccount, IPerson, IOrganization } from '../debtor.interfaces';
import { ApiType, getApiUrl, addCommonHeaders } from '../../../apiUtils';

// Define operation field properties
export const createDebtorFields: INodeProperties[] = [
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
		description: 'Whether to input data via fields or JSON object',
		displayOptions: {
			show: {
				resource: ['debtor'],
			},
		},
	},
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description: 'Whether to act on behalf of a client company when making this request',
		displayOptions: {
			show: {
				resource: ['debtor'],
			},
		},
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
				resource: ['debtor'],
			},
		},
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
  ],
  "metadata": [
    {
      "type": "user:reference",
      "value": "string"
    }
  ],
  "events": [
    {
      "type": "registration",
      "title": "string",
      "occurence": "2019-08-24T14:15:22Z",
      "your_reference": "string",
      "description": "string",
      "location": "string"
    }
  ]
}`,
		required: true,
		displayOptions: {
			show: {
				inputType: ['json'],
				resource: ['debtor'],
			},
		},
		description: 'Debtor data as JSON object. Must include your_reference, acting_as, addresses, and either person or organization details.',
	},
	{
		displayName: 'Debtor Type',
		name: 'debtor_type',
		type: 'options',
		options: [
			{
				name: 'Person',
				value: 'person',
			},
			{
				name: 'Organization',
				value: 'organization',
			},
		],
		default: 'person',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['debtor'],
			},
		},
		description: 'Whether the debtor is a person or an organization',
	},
	{
		displayName: 'Your Reference',
		name: 'your_reference',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['debtor'],
			},
		},
		description: 'Your reference for this debtor',
	},
	// Person Fields
	{
		displayName: 'Salutation',
		name: 'salutation',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				inputType: ['fields'],
				debtor_type: ['person'],
			},
		},
		description: 'Salutation such as Mr., Mrs., etc. (max 20 characters)',
	},
	{
		displayName: 'First Name',
		name: 'first_name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				debtor_type: ['person'],
			},
		},
		description: 'First name (max 100 characters)',
	},
	{
		displayName: 'Last Name',
		name: 'last_name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				debtor_type: ['person'],
			},
		},
		description: 'Last name (max 100 characters)',
	},
	{
		displayName: 'Birth Date',
		name: 'birth_date',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
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
				inputType: ['fields'],
			},
		},
		description: 'Whether the debtor is acting as a consumer or business',
	},
	// Address Fields
	{
		displayName: 'Addresses',
		name: 'addresses',
		placeholder: 'Add Address',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {
			addressValues: [
				{
					street: '',
					zip: '',
					city: '',
					country: 'DE',
				},
			],
		},
		displayOptions: {
			show: {
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
						description: 'Street and house number',
					},
					{
						displayName: 'ZIP',
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
						type: 'string',
						default: 'DE',
						required: true,
						description: 'ISO-3166-1 alpha-2 country code (e.g., DE, AT, CH)',
						hint: 'Common codes: DE (Germany), AT (Austria), CH (Switzerland), FR (France), IT (Italy), NL (Netherlands), etc.',
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
				inputType: ['fields'],
			},
		},
		options: [
			{
				name: 'communicationChannelValues',
				displayName: 'Channel',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{
								name: 'Email',
								value: 'email',
							},
							{
								name: 'Phone',
								value: 'phone',
							},
							{
								name: 'Mobile Phone',
								value: 'mobile_phone',
							},
							{
								name: 'Fax',
								value: 'fax',
							},
							{
								name: 'Skype',
								value: 'skype',
							},
							{
								name: 'Facebook Messenger',
								value: 'facebook_messenger',
							},
							{
								name: 'iMessage',
								value: 'imessage',
							},
							{
								name: 'WhatsApp',
								value: 'whatsapp',
							},
							{
								name: 'Facebook',
								value: 'facebook',
							},
							{
								name: 'Twitter',
								value: 'twitter',
							},
							{
								name: 'LinkedIn',
								value: 'linkedin',
							},
							{
								name: 'Xing',
								value: 'xing',
							},
							{
								name: 'Other Social Media',
								value: 'social_various',
							},
							{
								name: 'Website URL',
								value: 'website_url',
							},
							{
								name: 'Other Web Source',
								value: 'web_various',
							},
						],
						default: 'email',
						description: 'Type of communication channel',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Value for the communication channel (phone number, email address, etc.)',
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
				inputType: ['fields'],
			},
		},
		options: [
			{
				name: 'bankAccountValues',
				displayName: 'Bank Account',
				values: [
					{
						displayName: 'IBAN',
						name: 'iban',
						type: 'string',
						default: '',
						required: true,
						description: 'International Bank Account Number',
					},
					{
						displayName: 'BIC',
						name: 'bic',
						type: 'string',
						default: '',
						description: 'Bank Identifier Code',
					},
				],
			},
		],
	},
	// Metadata
	{
		displayName: 'Metadata',
		name: 'metadata',
		placeholder: 'Add Metadata',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				inputType: ['fields'],
			},
		},
		options: [
			{
				name: 'metadataValues',
				displayName: 'Metadata Item',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
						required: true,
						description: 'Type of metadata (e.g., "user:reference")',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Value of the metadata',
					},
				],
			},
		],
	},
	// Events
	{
		displayName: 'Events',
		name: 'events',
		placeholder: 'Add Event',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				inputType: ['fields'],
			},
		},
		options: [
			{
				name: 'eventsValues',
				displayName: 'Event',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: 'registration',
						required: true,
						description: 'Type of event (e.g., "registration")',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						default: '',
						required: true,
						description: 'Title of the event',
					},
					{
						displayName: 'Occurrence Date',
						name: 'occurence',
						type: 'string',
						default: '',
						required: true,
						description: 'Date when the event occurred in ISO format (e.g., "2019-08-24T14:15:22Z")',
					},
					{
						displayName: 'Your Reference',
						name: 'your_reference',
						type: 'string',
						default: '',
						description: 'Your reference for this event',
					},
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description of the event',
					},
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: '',
						description: 'Location of the event',
					},
				],
			},
		],
	},
];

/**
 * Helper function to validate if a value is valid (not null, undefined, or empty string)
 */
function isValidValue(value: any): boolean {
	return value !== null && value !== undefined && value !== '';
}

/**
 * Maps node parameters to the IDebtorData interface
 */
export function mapToDebtorData(this: IExecuteFunctions): IDebtorData {
	const inputType = this.getNodeParameter('inputType', 0) as string;
	
	if (inputType === 'json') {
		try {
			const jsonDataString = this.getNodeParameter('jsonData', 0) as string;
			const jsonData = JSON.parse(jsonDataString) as IDebtorData;
			
			// Validate required fields in JSON data
			if (!jsonData.your_reference) {
				throw new Error('JSON data must include your_reference');
			}
			
			if (!jsonData.person && !jsonData.organization) {
				throw new Error('JSON data must include either person or organization');
			}
			
			// If person is provided, validate required person fields
			if (jsonData.person) {
				if (!jsonData.person.first_name) {
					throw new Error('Person data must include first_name');
				}
				if (!jsonData.person.last_name) {
					throw new Error('Person data must include last_name');
				}
			}
			
			// If organization is provided, validate required organization fields
			if (jsonData.organization && !jsonData.organization.name) {
				throw new Error('Organization data must include name');
			}
			
			return jsonData;
		} catch (error) {
			if (error instanceof SyntaxError) {
				throw new Error(`Invalid JSON: ${error.message}`);
			}
			throw error;
		}
	}
	
	// Input type is 'fields'
	const debtorType = this.getNodeParameter('debtor_type', 0) as string;
	
	const debtorData: IDebtorData = {
		your_reference: this.getNodeParameter('your_reference', 0) as string,
		acting_as: this.getNodeParameter('acting_as', 0) as string,
		addresses: [], // Add empty addresses array to satisfy interface requirement
	};
	
	// Add person or organization data based on debtor type
	if (debtorType === 'person') {
		const person: IPerson = {
			first_name: this.getNodeParameter('first_name', 0) as string,
			last_name: this.getNodeParameter('last_name', 0) as string,
		};
		
		const salutation = this.getNodeParameter('salutation', 0, '') as string;
		if (salutation) {
			person.salutation = salutation;
		}
		
		const birthDate = this.getNodeParameter('birth_date', 0, '') as string;
		if (birthDate) {
			person.birth_date = birthDate;
		}
		
		debtorData.person = person;
	} else if (debtorType === 'organization') {
		const organization: IOrganization = {
			name: this.getNodeParameter('organization_name', 0) as string,
		};
		
		debtorData.organization = organization;
	}

	// Get addresses
	const addressesCollection = this.getNodeParameter('addresses', 0) as {
		addressValues: Array<{
			street: string;
			zip: string;
			city: string;
			country: string;
		}>;
	};

	const addresses = (addressesCollection.addressValues || []).map((address) => ({
		street: address.street,
		zip: address.zip,
		city: address.city,
		country: address.country,
	})) as IAddress[];

	// Get communication channels and filter out invalid entries
	const communicationChannelsCollection = this.getNodeParameter('communication_channels', 0, { communicationChannelValues: [] }) as {
		communicationChannelValues: Array<{
			type: string;
			value: string;
		}>;
	};

	const communicationChannels = (communicationChannelsCollection.communicationChannelValues || [])
		.filter((channel) => isValidValue(channel.type) && isValidValue(channel.value))
		.map((channel) => ({
			type: channel.type,
			value: channel.value,
		})) as ICommunicationChannel[];

	// Get bank accounts and filter out invalid entries
	const bankAccountsCollection = this.getNodeParameter('bank_accounts', 0, { bankAccountValues: [] }) as {
		bankAccountValues: Array<{
			iban: string;
			bic: string;
		}>;
	};

	const bankAccounts = (bankAccountsCollection.bankAccountValues || [])
		.filter((account) => isValidValue(account.iban))
		.map((account) => {
			const bankAccount: IBankAccount = {
				iban: account.iban,
			};
			
			if (isValidValue(account.bic)) {
				bankAccount.bic = account.bic;
			}
			
			return bankAccount;
		});

	// Get metadata
	const metadataCollection = this.getNodeParameter('metadata', 0, { metadataValues: [] }) as {
		metadataValues: Array<{
			type: string;
			value: string;
		}>;
	};

	const metadata = (metadataCollection.metadataValues || []).map((item) => ({
		type: item.type,
		value: item.value,
	}));

	// Get events
	const eventsCollection = this.getNodeParameter('events', 0, { eventsValues: [] }) as {
		eventsValues: Array<{
			type: string;
			title: string;
			occurence: string;
			your_reference?: string;
			description?: string;
			location?: string;
		}>;
	};

	const events = (eventsCollection.eventsValues || []).map((event) => {
		const eventData: any = {
			type: event.type,
			title: event.title,
			occurence: event.occurence,
		};
		
		if (event.your_reference) {
			eventData.your_reference = event.your_reference;
		}
		
		if (event.description) {
			eventData.description = event.description;
		}
		
		if (event.location) {
			eventData.location = event.location;
		}
		
		return eventData;
	});

	// Combine all data
	debtorData.addresses = addresses;

	if (communicationChannels.length > 0) {
		debtorData.communication_channels = communicationChannels;
	}

	if (bankAccounts.length > 0) {
		debtorData.bank_accounts = bankAccounts;
	}

	if (metadata.length > 0) {
		debtorData.metadata = metadata;
	}

	if (events.length > 0) {
		debtorData.events = events;
	}

	return debtorData;
}

export async function createDebtor(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createDebtor] operation function called');
	
	try {
		// Map node parameters to debtor data
		const debtorData = mapToDebtorData.call(this);
		console.log('[createDebtor] Data mapped:', { 
			hasYourReference: 'your_reference' in debtorData,
			hasPersonOrOrg: !!(debtorData.person || debtorData.organization),
			addressCount: debtorData.addresses?.length || 0
		});
		
		// Make the API request
		console.log('[createDebtor] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'debtors');
		
		const options = {
			method: 'POST',
			url: url,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: debtorData,
		};
		
		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
		
		console.log('[createDebtor] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[createDebtor] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createDebtor] Error:', error);
		throw error;
	}
}
