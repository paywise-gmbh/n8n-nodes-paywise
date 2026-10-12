import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	idempotencyKeyFor,
	paywiseApiRequest,
	paywiseApiRequestAllItems,
	parseJsonParameter,
} from '../../transport';
import { apiPath, compact, type ExecutorResult } from '../shared';

function buildCreateBody(this: IExecuteFunctions, i: number): IDataObject {
	const actingAs = this.getNodeParameter('actingAs', i) as string;
	const extra = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

	const body: IDataObject = {
		acting_as: actingAs,
		addresses: [
			{
				street: this.getNodeParameter('street', i),
				postal_code: this.getNodeParameter('postalCode', i),
				city: this.getNodeParameter('city', i),
				country: this.getNodeParameter('country', i, 'DE'),
				primary: true,
			},
		],
	};

	if (actingAs === 'business') {
		body.organization = { name: this.getNodeParameter('organizationName', i) };
		const legalForm = this.getNodeParameter('legalForm', i, '') as string;
		if (legalForm) body.legal_form = legalForm;
	} else {
		body.person = compact({
			first_name: this.getNodeParameter('firstName', i),
			last_name: this.getNodeParameter('lastName', i),
			salutation: extra.salutation ?? '',
			birth_date: extra.birthDate ?? '',
		});
	}

	const channels = [
		['email', extra.email],
		['phone', extra.phone],
		['mobile_phone', extra.mobilePhone],
	]
		.filter(([, value]) => value)
		.map(([type, value]) => ({ type, value }));
	if (channels.length) body.communication_channels = channels;
	if (extra.yourReference) body.your_reference = extra.yourReference;

	const more = typeof extra.extra === 'string' ? JSON.parse(extra.extra || '{}') : extra.extra;
	return { ...body, ...((more as IDataObject) ?? {}) };
}

export async function executeDebtor(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ExecutorResult> {
	const debtorPath = () => apiPath`/v2/debtors/${this.getNodeParameter('debtorId', i) as string}/`;

	switch (operation) {
		case 'create': {
			const body = buildCreateBody.call(this, i);
			return await paywiseApiRequest.call(this, 'POST', '/v2/debtors/', {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'debtor.create', body),
				itemIndex: i,
			});
		}
		case 'get':
			return await paywiseApiRequest.call(this, 'GET', debtorPath(), { itemIndex: i });
		case 'getAll': {
			const limit = this.getNodeParameter('returnAll', i)
				? Infinity
				: (this.getNodeParameter('limit', i) as number);
			const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
			return await paywiseApiRequestAllItems.call(this, '/v2/debtors/', filters, limit, i);
		}
		case 'update': {
			const body = parseJsonParameter<IDataObject>(this, 'updateBody', i, {});
			return await paywiseApiRequest.call(this, 'PATCH', debtorPath(), { body, itemIndex: i });
		}
	}

	throw new NodeOperationError(this.getNode(), `Unknown debtor operation "${operation}"`, {
		itemIndex: i,
	});
}
