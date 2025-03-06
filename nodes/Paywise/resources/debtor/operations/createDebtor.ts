import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { IDebtorData, IAddress, ICommunicationChannel, IBankAccount, IMetadata, IEvent, IPerson, IOrganization } from '../debtor.interfaces';

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
				inputType: ['json'],
			},
		},
		description: 'Debtor data as JSON object',
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
								name: 'Mobile',
								value: 'mobile',
							},
							{
								name: 'Fax',
								value: 'fax',
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
				displayName: 'Metadata Entry',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
						required: true,
						description: 'Type of metadata',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						required: true,
						description: 'Value for the metadata',
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
				name: 'eventValues',
				displayName: 'Event',
				values: [
					{
						displayName: 'Type',
						name: 'type',
						type: 'string',
						default: '',
						required: true,
						description: 'Type of event',
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
						type: 'dateTime',
						default: '',
						required: true,
						description: 'Date when the event occurred',
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
 * Maps node parameters to the IDebtorData interface
 */
export function mapToDebtorData(this: IExecuteFunctions): IDebtorData {
	const inputType = this.getNodeParameter('inputType', 0) as string;
	
	if (inputType === 'json') {
		return JSON.parse(this.getNodeParameter('jsonData', 0) as string) as IDebtorData;
	}
	
	const debtorType = this.getNodeParameter('debtor_type', 0) as string;
	const yourReference = this.getNodeParameter('your_reference', 0) as string;
	const actingAs = this.getNodeParameter('acting_as', 0) as string;

	// Create base debtor data
	const debtorData: IDebtorData = {
		your_reference: yourReference,
		acting_as: actingAs,
		addresses: [],
	};

	// Handle person or organization specific fields
	if (debtorType === 'person') {
		const salutation = this.getNodeParameter('salutation', 0, '') as string;
		const firstName = this.getNodeParameter('first_name', 0) as string;
		const lastName = this.getNodeParameter('last_name', 0) as string;
		const birthDate = this.getNodeParameter('birth_date', 0, '') as string;

		const person: IPerson = {
			first_name: firstName,
			last_name: lastName,
		};

		if (salutation) {
			person.salutation = salutation;
		}

		if (birthDate) {
			person.birth_date = birthDate;
		}

		debtorData.person = person;
	} else if (debtorType === 'organization') {
		const organizationName = this.getNodeParameter('organization_name', 0) as string;
		
		debtorData.organization = {
			name: organizationName,
		};
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

	// Get communication channels
	const communicationChannelsCollection = this.getNodeParameter('communication_channels', 0, { communicationChannelValues: [] }) as {
		communicationChannelValues: Array<{
			type: string;
			value: string;
		}>;
	};

	const communicationChannels = (communicationChannelsCollection.communicationChannelValues || []).map((channel) => ({
		type: channel.type,
		value: channel.value,
	})) as ICommunicationChannel[];

	// Get bank accounts
	const bankAccountsCollection = this.getNodeParameter('bank_accounts', 0, { bankAccountValues: [] }) as {
		bankAccountValues: Array<{
			iban: string;
			bic: string;
		}>;
	};

	const bankAccounts = (bankAccountsCollection.bankAccountValues || []).map((account) => {
		const bankAccount: IBankAccount = {
			iban: account.iban,
		};
		
		if (account.bic) {
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

	const metadata = (metadataCollection.metadataValues || []).map((meta) => ({
		type: meta.type,
		value: meta.value,
	})) as IMetadata[];

	// Get events
	const eventsCollection = this.getNodeParameter('events', 0, { eventValues: [] }) as {
		eventValues: Array<{
			type: string;
			title: string;
			occurence: string;
			your_reference: string;
			description: string;
			location: string;
		}>;
	};

	const events = (eventsCollection.eventValues || []).map((event) => {
		const newEvent: IEvent = {
			type: event.type,
			title: event.title,
			occurence: event.occurence.split('T')[0],
		};

		if (event.your_reference) {
			newEvent.your_reference = event.your_reference;
		}

		if (event.description) {
			newEvent.description = event.description;
		}

		if (event.location) {
			newEvent.location = event.location;
		}

		return newEvent;
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
		
		// Make the API request directly
		console.log('[createDebtor] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		const options = {
			method: 'POST',
			url: `${credentials.baseUrl}/debtors/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: debtorData,
		};
		
		console.log('[createDebtor] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createDebtor] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createDebtor] Error:', error);
		throw error;
	}
} 