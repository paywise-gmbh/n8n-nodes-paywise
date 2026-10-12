import type { INodeProperties } from 'n8n-workflow';
import { idParameter, returnAllOrLimit } from '../shared';

const forDebtor = (operation: string[]) => ({ show: { resource: ['debtor'], operation } });
const forActingAs = (actingAs: string) => ({
	show: { resource: ['debtor'], operation: ['create'], actingAs: [actingAs] },
});

export const debtorDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['debtor'] } },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a debtor' },
			{ name: 'Get', value: 'get', action: 'Get a debtor' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many debtors' },
			{
				name: 'Update',
				value: 'update',
				action: 'Update a debtor',
				description: 'Change a debtor. Lists such as addresses are replaced as a whole.',
			},
		],
		default: 'create',
	},

	// create
	{
		displayName: 'Debtor Type',
		name: 'actingAs',
		type: 'options',
		options: [
			{ name: 'Consumer', value: 'consumer', description: 'A private person' },
			{ name: 'Business', value: 'business', description: 'A company or self-employed person' },
		],
		default: 'consumer',
		displayOptions: forDebtor(['create']),
	},
	{
		displayName: 'Company Name',
		name: 'organizationName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forActingAs('business'),
	},
	{
		displayName: 'Legal Form Name or ID',
		name: 'legalForm',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getLegalForms' },
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		displayOptions: forActingAs('business'),
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forActingAs('consumer'),
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forActingAs('consumer'),
	},
	{
		displayName: 'Street',
		name: 'street',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'Musterstraße 12',
		description: 'Street and house number',
		displayOptions: forDebtor(['create']),
	},
	{
		displayName: 'Postal Code',
		name: 'postalCode',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forDebtor(['create']),
	},
	{
		displayName: 'City',
		name: 'city',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forDebtor(['create']),
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: 'DE',
		description: 'Two-letter ISO country code',
		displayOptions: forDebtor(['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: forDebtor(['create']),
		options: [
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Consumers only',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
			},
			{
				displayName: 'Mobile Phone',
				name: 'mobilePhone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'More Fields (JSON)',
				name: 'extra',
				type: 'json',
				default: '{}',
				description:
					'Further API fields merged into the request, e.g. bank_accounts, legal_representatives or metadata',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Salutation',
				name: 'salutation',
				type: 'options',
				options: [
					{ name: 'Mr', value: 'mr' },
					{ name: 'Ms', value: 'ms' },
					{ name: 'Mx', value: 'mx' },
				],
				default: 'mr',
			},
			{
				displayName: 'Your Reference',
				name: 'yourReference',
				type: 'string',
				default: '',
				description: 'Your own ID for the debtor, e.g. the customer number',
			},
		],
	},

	idParameter('debtor', ['get', 'update'], 'debtorId', 'Debtor ID'),

	// update
	{
		displayName: 'Fields to Update (JSON)',
		name: 'updateBody',
		type: 'json',
		required: true,
		default: '{\n  "your_reference": "CUSTOMER-1001"\n}',
		description:
			'API fields to change. Arrays such as addresses or communication_channels replace the existing list completely.',
		displayOptions: forDebtor(['update']),
	},

	// getAll
	...returnAllOrLimit(forDebtor(['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: forDebtor(['getAll']),
		options: [
			{
				displayName: 'Debtor Type',
				name: 'acting_as',
				type: 'options',
				options: [
					{ name: 'Business', value: 'business' },
					{ name: 'Consumer', value: 'consumer' },
				],
				default: 'consumer',
			},
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Your Reference',
				name: 'your_reference',
				type: 'string',
				default: '',
			},
		],
	},
];
