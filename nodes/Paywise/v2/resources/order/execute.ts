import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	idempotencyKeyFor,
	paywiseApiRequest,
	paywiseApiRequestAllItems,
	parseJsonParameter,
} from '../../transport';
import { compact, splitIds } from '../shared';

function orderFields(fields: IDataObject): IDataObject {
	const body = compact(fields);
	if ('additional_debtor_ids' in body) {
		body.additional_debtor_ids = splitIds(body.additional_debtor_ids);
	}
	if (typeof body.rental_agreement === 'string') {
		body.rental_agreement = JSON.parse(body.rental_agreement);
	}
	return body;
}

async function finalize(this: IExecuteFunctions, i: number, orderId: string) {
	const path = `/v2/orders/${encodeURIComponent(orderId)}/finalize/`;
	return await paywiseApiRequest.call(this, 'POST', path, {
		body: {},
		idempotencyKey: idempotencyKeyFor.call(this, i, 'order.finalize', { orderId }),
		itemIndex: i,
	});
}

export async function executeOrder(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject | IDataObject[]> {
	const orderPath = () =>
		`/v2/orders/${encodeURIComponent(this.getNodeParameter('orderId', i) as string)}/`;

	switch (operation) {
		case 'create': {
			const body: IDataObject = {
				type: this.getNodeParameter('orderType', i),
				debtor_id: this.getNodeParameter('debtorId', i),
				claims: parseJsonParameter<IDataObject[]>(this, 'claims', i, []),
				...orderFields(this.getNodeParameter('additionalFields', i, {}) as IDataObject),
			};
			const order = await paywiseApiRequest.call(this, 'POST', '/v2/orders/', {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'order.create', body),
				itemIndex: i,
			});
			if (this.getNodeParameter('submit', i, false) as boolean) {
				return await finalize.call(this, i, order.id as string);
			}
			return order;
		}

		case 'get':
			return await paywiseApiRequest.call(this, 'GET', orderPath(), { itemIndex: i });

		case 'getAll': {
			const returnAll = this.getNodeParameter('returnAll', i) as boolean;
			const limit = returnAll ? Infinity : (this.getNodeParameter('limit', i) as number);
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			return await paywiseApiRequestAllItems.call(this, '/v2/orders/', filters, limit, i);
		}

		case 'update': {
			const body = orderFields(this.getNodeParameter('updateFields', i, {}) as IDataObject);
			return await paywiseApiRequest.call(this, 'PATCH', orderPath(), { body, itemIndex: i });
		}

		case 'delete': {
			await paywiseApiRequest.call(this, 'DELETE', orderPath(), { itemIndex: i });
			return { id: this.getNodeParameter('orderId', i), deleted: true };
		}

		case 'finalize':
			return await finalize.call(this, i, this.getNodeParameter('orderId', i) as string);

		case 'withdraw': {
			const reason = this.getNodeParameter('reason', i, '') as string;
			const body: IDataObject = reason ? { reason } : {};
			return await paywiseApiRequest.call(this, 'POST', `${orderPath()}withdraw/`, {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'order.withdraw', {
					orderPath: orderPath(),
					...body,
				}),
				itemIndex: i,
			});
		}
	}

	throw new NodeOperationError(this.getNode(), `Unknown order operation "${operation}"`, {
		itemIndex: i,
	});
}
