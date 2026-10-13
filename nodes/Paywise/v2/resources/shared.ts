import type {
	IDataObject,
	IDisplayOptions,
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
} from 'n8n-workflow';
import { paywiseApiDownload } from '../transport';

export function returnAllOrLimit(displayOptions: IDisplayOptions): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions,
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			typeOptions: { minValue: 1 },
			default: 50,
			description: 'Max number of results to return',
			displayOptions: {
				...displayOptions,
				show: { ...displayOptions.show, returnAll: [false] },
			},
		},
	];
}

export function idempotencyKeyOption(displayOptions: IDisplayOptions): INodeProperties {
	return {
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions,
		options: [
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Key that makes retries safe: the same key and body within 24 hours returns the original result instead of acting twice. Generated per execution and item when empty. Use your own (e.g. an invoice number) to deduplicate across executions.',
			},
		],
	};
}

/** Drops empty strings so optional fields the user added but left blank are not sent. */
export function compact(fields: IDataObject): IDataObject {
	return Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== ''));
}

export function splitIds(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
}

/** Output of an operation that returns files instead of plain JSON items. */
export class BinaryResult {
	constructor(readonly items: INodeExecutionData[]) {}
}

export type ExecutorResult = IDataObject | IDataObject[] | BinaryResult;

export function binaryPropertyOption(displayOptions: IDisplayOptions): INodeProperties {
	return {
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The name of the output binary field to put the file in',
		displayOptions,
	};
}

export async function downloadAsBinary(
	this: IExecuteFunctions,
	path: string,
	itemIndex: number,
	fallbackFileName: string,
	qs?: IDataObject,
): Promise<BinaryResult> {
	const file = await paywiseApiDownload.call(this, path, { qs, itemIndex });
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	const binary = await this.helpers.prepareBinaryData(
		file.data,
		file.fileName ?? fallbackFileName,
		file.mimeType,
	);
	return new BinaryResult([
		{
			json: { fileName: binary.fileName, mimeType: binary.mimeType, fileSize: binary.fileSize },
			binary: { [binaryPropertyName]: binary },
			pairedItem: { item: itemIndex },
		},
	]);
}

/** Single ID parameter shown for the given operations of a resource. */
export function idParameter(
	resource: string,
	operations: string[],
	name: string,
	displayName: string,
	description?: string,
): INodeProperties {
	return {
		displayName,
		name,
		type: 'string',
		required: true,
		default: '',
		description,
		displayOptions: { show: { resource: [resource], operation: operations } },
	};
}

export function apiPath(template: TemplateStringsArray, ...ids: string[]): string {
	return template.reduce(
		(result, part, i) => result + part + (i < ids.length ? encodeURIComponent(ids[i]) : ''),
		'',
	);
}
