import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	idempotencyKeyFor,
	paywiseApiRequest,
	paywiseApiRequestAllItems,
	parseJsonParameter,
} from '../../transport';
import {
	apiPath,
	compact,
	type ExecutorResult,
	idempotencyKeyOption,
	idParameter,
	returnAllOrLimit,
} from '../shared';

const forClaim = (operation: string[]) => ({ show: { resource: ['claim'], operation } });

const CLAIM_EXAMPLE = JSON.stringify(
	{
		type: 'receivable',
		your_reference: 'INV-2026-0043',
		document_reference: '2026-0043',
		subject_matter: 'Website maintenance July 2026',
		document_date: '2026-07-05',
		due_date: '2026-07-19',
		principal_amount: { value: '250.00', currency: 'EUR' },
		is_disputed: false,
		legal_basis: { claim_type_code: 'H11', description: 'Maintenance contract of 2026-01-10' },
		delay_date: '2026-07-20',
	},
	null,
	2,
);

export const claimDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['claim'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Add a claim to a draft order',
				description: 'Add a claim to an order that is still a draft',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a claim',
				description: 'Delete a claim while its order is still a draft',
			},
			{ name: 'Get', value: 'get', action: 'Get a claim' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many claims' },
			{
				name: 'Update',
				value: 'update',
				action: 'Update a claim',
				description: 'Change a claim while its order is still a draft',
			},
		],
		default: 'get',
	},

	idParameter('claim', ['create'], 'orderId', 'Order ID', 'ID of the draft order'),
	{
		displayName: 'Claim (JSON)',
		name: 'claim',
		type: 'json',
		required: true,
		default: CLAIM_EXAMPLE,
		description:
			'The claim as described in the <a href="https://docs.paywise.de/api-docs/case-management-api/introduction">API documentation</a>',
		displayOptions: forClaim(['create']),
	},

	idParameter('claim', ['get', 'update', 'delete'], 'claimId', 'Claim ID'),
	{
		displayName: 'Fields to Update (JSON)',
		name: 'updateBody',
		type: 'json',
		required: true,
		default: '{\n  "due_date": "2026-07-31"\n}',
		displayOptions: forClaim(['update']),
	},

	...returnAllOrLimit(forClaim(['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: forClaim(['getAll']),
		options: [
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Accepted', value: 'accepted' },
					{ name: 'Awaiting Client Response', value: 'awaiting_client_response' },
					{ name: 'Draft', value: 'draft' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Submitted', value: 'submitted' },
					{ name: 'Withdrawn', value: 'withdrawn' },
				],
				default: 'accepted',
			},
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
			},
		],
	},

	idempotencyKeyOption(forClaim(['create'])),
];

export async function executeClaim(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ExecutorResult> {
	const claimPath = () => apiPath`/v2/claims/${this.getNodeParameter('claimId', i) as string}/`;

	switch (operation) {
		case 'create': {
			const body: IDataObject = {
				...parseJsonParameter<IDataObject>(this, 'claim', i, {}),
				order_id: this.getNodeParameter('orderId', i),
			};
			return await paywiseApiRequest.call(this, 'POST', '/v2/claims/', {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'claim.create', body),
				itemIndex: i,
			});
		}
		case 'get':
			return await paywiseApiRequest.call(this, 'GET', claimPath(), { itemIndex: i });
		case 'getAll': {
			const limit = this.getNodeParameter('returnAll', i)
				? Infinity
				: (this.getNodeParameter('limit', i) as number);
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			return await paywiseApiRequestAllItems.call(this, '/v2/claims/', filters, limit, i);
		}
		case 'update': {
			const body = parseJsonParameter<IDataObject>(this, 'updateBody', i, {});
			return await paywiseApiRequest.call(this, 'PATCH', claimPath(), { body, itemIndex: i });
		}
		case 'delete': {
			await paywiseApiRequest.call(this, 'DELETE', claimPath(), { itemIndex: i });
			return { id: this.getNodeParameter('claimId', i), deleted: true };
		}
	}

	throw new NodeOperationError(this.getNode(), `Unknown claim operation "${operation}"`, {
		itemIndex: i,
	});
}
