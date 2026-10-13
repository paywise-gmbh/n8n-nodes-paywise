import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { paywiseApiRequest, paywiseApiRequestAllItems } from '../../transport';
import {
	apiPath,
	binaryPropertyOption,
	compact,
	downloadAsBinary,
	type ExecutorResult,
	idParameter,
	returnAllOrLimit,
} from '../shared';

const forMandate = (operation: string[]) => ({ show: { resource: ['mandate'], operation } });

export const mandateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['mandate'] } },
		options: [
			{
				name: 'Download Document',
				value: 'downloadDocument',
				action: 'Download a mandate document',
			},
			{ name: 'Get', value: 'get', action: 'Get a mandate' },
			{
				name: 'Get Documents',
				value: 'getDocuments',
				action: 'Get the documents of a mandate',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				action: 'Get the history of a mandate',
				description: 'Get the status updates paywise published for a mandate',
			},
			{ name: 'Get Many', value: 'getAll', action: 'Get many mandates' },
		],
		default: 'get',
	},

	idParameter(
		'mandate',
		['get', 'getHistory', 'getDocuments', 'downloadDocument'],
		'mandateId',
		'Mandate ID',
		'ID of the mandate (case) paywise created when it accepted the order',
	),
	idParameter('mandate', ['downloadDocument'], 'documentId', 'Document ID'),
	{
		displayName: 'Include History',
		name: 'includeHistory',
		type: 'boolean',
		default: false,
		description: 'Whether to include the published status updates in the result',
		displayOptions: forMandate(['get']),
	},
	binaryPropertyOption(forMandate(['downloadDocument'])),

	...returnAllOrLimit(forMandate(['getAll', 'getHistory', 'getDocuments'])),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: forMandate(['getAll']),
		options: [
			{
				displayName: 'Archived',
				name: 'archived',
				type: 'boolean',
				default: false,
				description: 'Whether to return archived instead of active mandates',
			},
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
				displayName: 'Payment State',
				name: 'payment_state',
				type: 'multiOptions',
				options: [
					{ name: 'Fully Paid', value: 'fully_paid' },
					{ name: 'Partially Paid', value: 'partially_paid' },
					{ name: 'Unpaid', value: 'unpaid' },
				],
				default: [],
			},
			{
				displayName: 'Processing State',
				name: 'processing_state',
				type: 'multiOptions',
				options: [
					{ name: 'Canceled by Client', value: 'canceled_by_client' },
					{ name: 'Canceled by Service Provider', value: 'canceled_by_service_provider' },
					{ name: 'Ended', value: 'ended' },
					{ name: 'In Progress', value: 'in_progress' },
					{ name: 'Paused', value: 'paused' },
				],
				default: [],
			},
			{
				displayName: 'Reference Number',
				name: 'reference_number',
				type: 'string',
				default: '',
				placeholder: 'K26-6612Y',
				description: 'The paywise file number (Aktenzeichen)',
			},
			{
				displayName: 'Requests to Client',
				name: 'requests',
				type: 'multiOptions',
				options: [
					{ name: 'Has Answered Requests', value: 'has_answered_requests_to_client' },
					{ name: 'Has No Requests', value: 'has_no_requests_to_client' },
					{ name: 'Has Open Requests', value: 'has_open_requests_to_client' },
				],
				default: [],
			},
			{
				displayName: 'Search',
				name: 'q',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Updated Since',
				name: 'updated_since',
				type: 'dateTime',
				default: '',
				description: 'Only mandates changed at or after this time, including archived ones',
			},
		],
	},
];

function mandateFilters(filters: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(compact(filters)).filter(([, value]) => !Array.isArray(value) || value.length),
	);
}

export async function executeMandate(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ExecutorResult> {
	if (operation === 'getAll') {
		const limit = this.getNodeParameter('returnAll', i)
			? Infinity
			: (this.getNodeParameter('limit', i) as number);
		const filters = mandateFilters(this.getNodeParameter('filters', i, {}) as IDataObject);
		return await paywiseApiRequestAllItems.call(this, '/v2/mandates/', filters, limit, i);
	}

	const mandatePath = apiPath`/v2/mandates/${this.getNodeParameter('mandateId', i) as string}/`;
	const limit = () =>
		this.getNodeParameter('returnAll', i)
			? Infinity
			: (this.getNodeParameter('limit', i) as number);

	switch (operation) {
		case 'get': {
			const qs = this.getNodeParameter('includeHistory', i, false) ? { history: true } : {};
			return await paywiseApiRequest.call(this, 'GET', mandatePath, { qs, itemIndex: i });
		}
		case 'getHistory':
			return await paywiseApiRequestAllItems.call(this, `${mandatePath}history/`, {}, limit(), i);
		case 'getDocuments':
			return await paywiseApiRequestAllItems.call(this, `${mandatePath}documents/`, {}, limit(), i);
		case 'downloadDocument': {
			const documentId = this.getNodeParameter('documentId', i) as string;
			return await downloadAsBinary.call(
				this,
				`${mandatePath}documents/${encodeURIComponent(documentId)}/download/`,
				i,
				'document',
			);
		}
	}

	throw new NodeOperationError(this.getNode(), `Unknown mandate operation "${operation}"`, {
		itemIndex: i,
	});
}
