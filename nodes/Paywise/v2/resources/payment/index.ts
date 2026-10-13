import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { idempotencyKeyFor, paywiseApiRequest, paywiseApiRequestAllItems } from '../../transport';
import {
	apiPath,
	compact,
	type ExecutorResult,
	idempotencyKeyOption,
	idParameter,
	returnAllOrLimit,
} from '../shared';

const forPayment = (operation: string[]) => ({ show: { resource: ['payment'], operation } });

export const paymentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['payment'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a reported payment',
				description: 'Delete a payment reported on a claim before the order was accepted',
			},
			{ name: 'Get', value: 'get', action: 'Get a payment' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many payments' },
			{
				name: 'Report',
				value: 'report',
				action: 'Report a payment',
				description: 'Tell paywise that the debtor paid you directly',
			},
		],
		default: 'report',
	},

	// report
	{
		displayName: 'Report On',
		name: 'target',
		type: 'options',
		options: [
			{
				name: 'Mandate',
				value: 'mandate',
				description: 'After paywise accepted the order',
			},
			{
				name: 'Claim',
				value: 'claim',
				description: 'Before paywise accepted the order',
			},
		],
		default: 'mandate',
		displayOptions: forPayment(['report']),
	},
	{
		...idParameter('payment', ['report'], 'mandateId', 'Mandate ID'),
		displayOptions: { show: { resource: ['payment'], operation: ['report'], target: ['mandate'] } },
	},
	{
		...idParameter('payment', ['report'], 'claimId', 'Claim ID'),
		displayOptions: { show: { resource: ['payment'], operation: ['report'], target: ['claim'] } },
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		typeOptions: { minValue: 0.01, numberPrecision: 2 },
		required: true,
		default: 0,
		displayOptions: forPayment(['report']),
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'string',
		default: 'EUR',
		displayOptions: forPayment(['report']),
	},
	{
		displayName: 'Value Date',
		name: 'valueDate',
		type: 'dateTime',
		required: true,
		default: '',
		description: 'Date the money arrived',
		displayOptions: forPayment(['report']),
	},
	{
		displayName: 'Your Reference',
		name: 'yourReference',
		type: 'string',
		default: '',
		description: 'Your own ID for the payment, e.g. the bank transaction ID',
		displayOptions: forPayment(['report']),
	},

	idParameter('payment', ['get'], 'paymentId', 'Payment ID'),
	idParameter('payment', ['delete'], 'claimId', 'Claim ID'),
	idParameter('payment', ['delete'], 'paymentId', 'Payment ID'),

	...returnAllOrLimit(forPayment(['getAll'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: forPayment(['getAll']),
		options: [
			{ displayName: 'Claim ID', name: 'claim', type: 'string', default: '' },
			{ displayName: 'Mandate ID', name: 'mandate', type: 'string', default: '' },
			{ displayName: 'Updated Since', name: 'updated_since', type: 'dateTime', default: '' },
			{ displayName: 'Value Date After', name: 'value_date_after', type: 'dateTime', default: '' },
			{
				displayName: 'Value Date Before',
				name: 'value_date_before',
				type: 'dateTime',
				default: '',
			},
			{ displayName: 'Your Reference', name: 'your_reference', type: 'string', default: '' },
		],
	},

	idempotencyKeyOption(forPayment(['report'])),
];

const dateOnly = (value: unknown) => String(value ?? '').slice(0, 10);

export async function executePayment(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ExecutorResult> {
	switch (operation) {
		case 'report': {
			const target = this.getNodeParameter('target', i) as string;
			const id = this.getNodeParameter(target === 'claim' ? 'claimId' : 'mandateId', i) as string;
			const path =
				target === 'claim'
					? apiPath`/v2/claims/${id}/payments/`
					: apiPath`/v2/mandates/${id}/payments/`;
			const body: IDataObject = compact({
				amount: {
					value: (this.getNodeParameter('amount', i) as number).toFixed(2),
					currency: this.getNodeParameter('currency', i, 'EUR'),
				},
				value_date: dateOnly(this.getNodeParameter('valueDate', i)),
				your_reference: this.getNodeParameter('yourReference', i, ''),
			});
			return await paywiseApiRequest.call(this, 'POST', path, {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'payment.report', { path, ...body }),
				itemIndex: i,
			});
		}
		case 'get': {
			const id = this.getNodeParameter('paymentId', i) as string;
			return await paywiseApiRequest.call(this, 'GET', apiPath`/v2/payments/${id}/`, {
				itemIndex: i,
			});
		}
		case 'getAll': {
			const limit = this.getNodeParameter('returnAll', i)
				? Infinity
				: (this.getNodeParameter('limit', i) as number);
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			for (const key of ['value_date_after', 'value_date_before']) {
				if (filters[key]) filters[key] = dateOnly(filters[key]);
			}
			return await paywiseApiRequestAllItems.call(this, '/v2/payments/', filters, limit, i);
		}
		case 'delete': {
			const claimId = this.getNodeParameter('claimId', i) as string;
			const paymentId = this.getNodeParameter('paymentId', i) as string;
			await paywiseApiRequest.call(
				this,
				'DELETE',
				apiPath`/v2/claims/${claimId}/payments/${paymentId}/`,
				{ itemIndex: i },
			);
			return { id: paymentId, deleted: true };
		}
	}

	throw new NodeOperationError(this.getNode(), `Unknown payment operation "${operation}"`, {
		itemIndex: i,
	});
}
