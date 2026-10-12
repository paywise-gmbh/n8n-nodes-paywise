import type { IDataObject, IDisplayOptions, INodeProperties } from 'n8n-workflow';

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
