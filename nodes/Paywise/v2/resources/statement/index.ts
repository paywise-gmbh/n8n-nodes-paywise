import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { paywiseApiRequest, paywiseApiRequestAllItems } from '../../transport';
import {
	binaryPropertyOption,
	compact,
	downloadAsBinary,
	type ExecutorResult,
	idParameter,
	returnAllOrLimit,
} from '../shared';

/**
 * Statements (Sammelabrechnungen) and single-mandate statements (Aktenabrechnungen) share
 * their operations; only the path and a few filters differ.
 */
const RESOURCES = {
	statement: { path: '/v2/statements/', noun: 'statement' },
	singleMandateStatement: {
		path: '/v2/single-mandate-statements/',
		noun: 'single mandate statement',
	},
} as const;

type StatementResource = keyof typeof RESOURCES;

function describe(resource: StatementResource): INodeProperties[] {
	const { noun } = RESOURCES[resource];
	const show = (operation: string[]) => ({ show: { resource: [resource], operation } });

	const filters: INodeProperties[] = [
		{ displayName: 'Booking Date From', name: 'booking_date_from', type: 'dateTime', default: '' },
		{ displayName: 'Booking Date To', name: 'booking_date_to', type: 'dateTime', default: '' },
		{ displayName: 'Clearing Number', name: 'clearing_no', type: 'string', default: '' },
		{ displayName: 'Invoice Number', name: 'invoice_no', type: 'string', default: '' },
		{
			displayName: 'Status',
			name: 'status',
			type: 'options',
			options: [
				{ name: 'Cancelled', value: 'cancelled' },
				{ name: 'Published', value: 'published' },
			],
			default: 'published',
		},
		{ displayName: 'Updated Since', name: 'updated_since', type: 'dateTime', default: '' },
	];
	if (resource === 'statement') {
		filters.push(
			{
				displayName: 'Mandate Reference Number',
				name: 'mandate_reference_number',
				type: 'string',
				default: '',
			},
			{ displayName: 'Search', name: 'q', type: 'string', default: '' },
		);
	} else {
		filters.push(
			{ displayName: 'Mandate ID', name: 'mandate', type: 'string', default: '' },
			{
				displayName: 'Statement Type',
				name: 'statement_type',
				type: 'options',
				options: [
					{ name: 'Expenses Invoice', value: 'expenses_invoice' },
					{ name: 'Final', value: 'final' },
					{ name: 'Interim', value: 'interim' },
					{ name: 'Negative Closing', value: 'negative_closing' },
					{
						name: 'Transition to Long-Term Monitoring',
						value: 'transition_to_longtime_monitoring',
					},
				],
				default: 'final',
			},
		);
	}
	filters.sort((a, b) => a.displayName.localeCompare(b.displayName));

	const properties: INodeProperties[] = [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: { show: { resource: [resource] } },
			options: [
				{ name: 'Download', value: 'download', action: `Download a ${noun}` },
				{ name: 'Get', value: 'get', action: `Get a ${noun}` },
				{ name: 'Get Many', value: 'getAll', action: `Get many ${noun}s` },
			],
			default: 'getAll',
		},
		idParameter(resource, ['get', 'download'], 'statementId', 'Statement ID'),
	];

	if (resource === 'statement') {
		properties.push({
			displayName: 'File',
			name: 'fileType',
			type: 'options',
			options: [
				{ name: 'Statement (PDF)', value: 'full-pdf' },
				{ name: 'Third-Party Money (XLSX)', value: 'third-party-money-xlsx' },
				{ name: 'Cost Burden (XLSX)', value: 'cost-burden-xlsx' },
				{ name: 'Closing (XLSX)', value: 'closing-xlsx' },
			],
			default: 'full-pdf',
			displayOptions: show(['download']),
		});
	}

	properties.push(binaryPropertyOption(show(['download'])), ...returnAllOrLimit(show(['getAll'])), {
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['getAll']),
		options: filters,
	});
	return properties;
}

export const statementDescription = describe('statement');
export const singleMandateStatementDescription = describe('singleMandateStatement');

const DATE_FILTERS = ['booking_date_from', 'booking_date_to'];

function executorFor(resource: StatementResource) {
	return async function (
		this: IExecuteFunctions,
		operation: string,
		i: number,
	): Promise<ExecutorResult> {
		const basePath = RESOURCES[resource].path;
		const itemPath = () =>
			`${basePath}${encodeURIComponent(this.getNodeParameter('statementId', i) as string)}/`;

		switch (operation) {
			case 'get':
				return await paywiseApiRequest.call(this, 'GET', itemPath(), { itemIndex: i });
			case 'getAll': {
				const limit = this.getNodeParameter('returnAll', i)
					? Infinity
					: (this.getNodeParameter('limit', i) as number);
				const filters = compact(this.getNodeParameter('filters', i, {}) as IDataObject);
				for (const key of DATE_FILTERS) {
					if (filters[key]) filters[key] = String(filters[key]).slice(0, 10);
				}
				return await paywiseApiRequestAllItems.call(this, basePath, filters, limit, i);
			}
			case 'download': {
				const qs =
					resource === 'statement' ? { type: this.getNodeParameter('fileType', i) } : undefined;
				return await downloadAsBinary.call(this, `${itemPath()}download/`, i, 'statement', qs);
			}
		}

		throw new NodeOperationError(this.getNode(), `Unknown ${resource} operation "${operation}"`, {
			itemIndex: i,
		});
	};
}

export const executeStatement = executorFor('statement');
export const executeSingleMandateStatement = executorFor('singleMandateStatement');
