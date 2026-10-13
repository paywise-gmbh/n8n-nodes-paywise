import type { INodeProperties } from 'n8n-workflow';
import { idempotencyKeyOption, returnAllOrLimit } from '../shared';

const forOrder = (operation: string[]) => ({ show: { resource: ['order'], operation } });

const CLAIMS_EXAMPLE = JSON.stringify(
	[
		{
			type: 'receivable',
			your_reference: 'INV-2026-0042',
			document_reference: '2026-0042',
			subject_matter: 'Website accessibility consulting in June 2026',
			document_date: '2026-06-05',
			due_date: '2026-06-19',
			principal_amount: { value: '100.00', currency: 'EUR' },
			is_disputed: false,
			legal_basis: { claim_type_code: 'H11', description: 'Consulting agreement of 2026-05-01' },
			reminders: [{ date: '2026-07-01', due_date: '2026-07-08' }],
		},
	],
	null,
	2,
);

const orderFields: INodeProperties[] = [
	{
		displayName: 'Starting Approach',
		name: 'starting_approach',
		type: 'options',
		options: [
			{
				name: 'Extrajudicial',
				value: 'extrajudicial',
				description: 'Start with out-of-court collection',
			},
			{
				name: 'Judicial',
				value: 'judicial',
				description: 'Start by applying for a payment order',
			},
		],
		default: 'extrajudicial',
		description: 'Initial route for invoice and rental orders',
	},
	{
		displayName: 'Creditor Obligation Fulfilled',
		name: 'creditor_obligation_fulfilled',
		type: 'boolean',
		default: true,
		description:
			'Whether you have fully performed your obligation to the debtor. Required before submitting invoice and rental orders.',
	},
	{
		displayName: 'Success Fee Confirmed',
		name: 'success_fee_confirmed',
		type: 'boolean',
		default: false,
		description:
			'Whether the success-fee arrangement is confirmed. Titled orders only; must be true before submitting.',
	},
	{
		displayName: 'Confirmation Email',
		name: 'confirmation_email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'Address that receives the order entry confirmation once the order is submitted',
	},
	{
		displayName: 'Additional Debtor IDs',
		name: 'additional_debtor_ids',
		type: 'string',
		default: '',
		description: 'Comma-separated IDs of up to 10 further debtors',
	},
];

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['order'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an order',
				description: 'Create a draft order with its claims, and optionally submit it',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a draft order',
				description: 'Delete an order that is still a draft',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an order',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
			},
			{
				name: 'Submit',
				value: 'finalize',
				action: 'Submit an order',
				description: 'Submit a draft order to paywise for review',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a draft order',
			},
			{
				name: 'Withdraw',
				value: 'withdraw',
				action: 'Withdraw an order',
				description: 'Withdraw a submitted order before it is accepted',
			},
		],
		default: 'create',
	},

	// create
	{
		displayName: 'Debtor ID',
		name: 'debtorId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of an existing debtor, the primary debtor of the order',
		displayOptions: forOrder(['create']),
	},
	{
		displayName: 'Order Type',
		name: 'orderType',
		type: 'options',
		options: [
			{ name: 'Invoice', value: 'invoice', description: 'Receivables from invoices' },
			{ name: 'Rental', value: 'rental', description: 'Rent arrears with a rental agreement' },
			{ name: 'Titled', value: 'titled', description: 'Claims with an enforceable title' },
		],
		default: 'invoice',
		displayOptions: forOrder(['create']),
	},
	{
		displayName: 'Claims (JSON)',
		name: 'claims',
		type: 'json',
		default: CLAIMS_EXAMPLE,
		description:
			'Claims to create with the order (max. 50). See the <a href="https://docs.paywise.de/api-docs/case-management-api/introduction">API documentation</a> for all fields.',
		displayOptions: forOrder(['create']),
	},
	{
		displayName: 'Submit Order',
		name: 'submit',
		type: 'boolean',
		default: false,
		description:
			'Whether to submit the order right after creating it. Leave off to keep a draft, e.g. to upload documents first.',
		displayOptions: forOrder(['create']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: forOrder(['create']),
		options: [
			...orderFields,
			{
				displayName: 'Rental Agreement (JSON)',
				name: 'rental_agreement',
				type: 'json',
				default: '{}',
				description: 'Rental agreement, only for rental orders',
			},
		],
	},

	// get, delete, finalize, update, withdraw
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: forOrder(['get', 'delete', 'finalize', 'update', 'withdraw']),
	},

	// update
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: forOrder(['update']),
		options: [
			{
				displayName: 'Debtor ID',
				name: 'debtor_id',
				type: 'string',
				default: '',
				description: 'Replace the primary debtor',
			},
			...orderFields,
		],
	},

	// withdraw
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		description: 'Optional explanation for the withdrawal, up to 5000 characters',
		displayOptions: forOrder(['withdraw']),
	},

	// getAll
	...returnAllOrLimit(forOrder(['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: forOrder(['getAll']),
		options: [
			{
				displayName: 'Created After',
				name: 'created_after',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Created Before',
				name: 'created_before',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Order Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Rental', value: 'rental' },
					{ name: 'Titled', value: 'titled' },
				],
				default: 'invoice',
			},
			{
				displayName: 'Search',
				name: 'q',
				type: 'string',
				default: '',
				description: 'Free-text search, e.g. debtor name or reference',
			},
			{
				displayName: 'Sort By',
				name: 'ordering',
				type: 'options',
				options: [
					{ name: 'Amount (Ascending)', value: 'amount' },
					{ name: 'Amount (Descending)', value: '-amount' },
					{ name: 'Created (Newest First)', value: '-created' },
					{ name: 'Created (Oldest First)', value: 'created' },
					{ name: 'Debtor Name', value: 'name' },
					{ name: 'Status', value: 'status' },
				],
				default: '-created',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Accepted', value: 'accepted' },
					{ name: 'Awaiting Client Response', value: 'awaiting_client_response' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Expired', value: 'expired' },
					{ name: 'Merged', value: 'merged' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Submitted', value: 'submitted' },
					{ name: 'Withdrawn', value: 'withdrawn' },
				],
				default: 'submitted',
			},
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
				description: 'Only orders changed at or after this time, useful for incremental syncs',
			},
		],
	},

	idempotencyKeyOption(forOrder(['create', 'finalize', 'withdraw'])),
];
