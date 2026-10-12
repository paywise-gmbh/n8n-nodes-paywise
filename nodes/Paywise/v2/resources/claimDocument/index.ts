import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { idempotencyKeyFor, paywiseApiRequest, paywiseApiRequestAllItems } from '../../transport';
import {
	apiPath,
	binaryPropertyOption,
	downloadAsBinary,
	type ExecutorResult,
	idempotencyKeyOption,
	idParameter,
	returnAllOrLimit,
} from '../shared';

const RESOURCE = 'claimDocument';
const forDocument = (operation: string[]) => ({ show: { resource: [RESOURCE], operation } });

export const claimDocumentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{ name: 'Delete', value: 'delete', action: 'Delete a claim document' },
			{ name: 'Download', value: 'download', action: 'Download a claim document' },
			{ name: 'Get', value: 'get', action: 'Get a claim document' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many claim documents' },
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a claim document',
				description: 'Attach a file such as the invoice or a reminder to a claim',
			},
		],
		default: 'upload',
	},

	idParameter(RESOURCE, ['upload', 'get', 'getAll', 'delete', 'download'], 'claimId', 'Claim ID'),
	idParameter(RESOURCE, ['get', 'delete', 'download'], 'documentId', 'Document ID'),

	// upload
	{
		displayName: 'Document Type',
		name: 'documentType',
		type: 'options',
		options: [
			{ name: 'Bank Statement', value: 'bank_statement' },
			{ name: 'Claim Statement', value: 'claim_statement' },
			{ name: 'Correspondence', value: 'correspondence' },
			{ name: 'Invoice', value: 'invoice' },
			{ name: 'Other', value: 'other' },
			{ name: 'Payment Proof', value: 'payment_proof' },
			{ name: 'Reminder', value: 'reminder' },
		],
		default: 'invoice',
		displayOptions: forDocument(['upload']),
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The name of the input binary field containing the file to upload',
		displayOptions: forDocument(['upload']),
	},

	binaryPropertyOption(forDocument(['download'])),
	...returnAllOrLimit(forDocument(['getAll'])),
	idempotencyKeyOption(forDocument(['upload'])),
];

export async function executeClaimDocument(
	this: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<ExecutorResult> {
	const claimId = this.getNodeParameter('claimId', i) as string;
	const documentsPath = apiPath`/v2/claims/${claimId}/documents/`;
	const documentPath = () =>
		`${documentsPath}${encodeURIComponent(this.getNodeParameter('documentId', i) as string)}/`;

	switch (operation) {
		case 'upload': {
			const property = this.getNodeParameter('binaryPropertyName', i) as string;
			const file = this.helpers.assertBinaryData(i, property);
			const content = await this.helpers.getBinaryDataBuffer(i, property);
			const body: IDataObject = {
				type: this.getNodeParameter('documentType', i),
				filename: file.fileName ?? 'document.pdf',
				base64: content.toString('base64'),
			};
			return await paywiseApiRequest.call(this, 'POST', documentsPath, {
				body,
				idempotencyKey: idempotencyKeyFor.call(this, i, 'claimDocument.upload', body),
				itemIndex: i,
			});
		}
		case 'get':
			return await paywiseApiRequest.call(this, 'GET', documentPath(), { itemIndex: i });
		case 'getAll': {
			const limit = this.getNodeParameter('returnAll', i)
				? Infinity
				: (this.getNodeParameter('limit', i) as number);
			return await paywiseApiRequestAllItems.call(this, documentsPath, {}, limit, i);
		}
		case 'delete': {
			await paywiseApiRequest.call(this, 'DELETE', documentPath(), { itemIndex: i });
			return { id: this.getNodeParameter('documentId', i), deleted: true };
		}
		case 'download':
			return await downloadAsBinary.call(this, `${documentPath()}download/`, i, 'document');
	}

	throw new NodeOperationError(this.getNode(), `Unknown claim document operation "${operation}"`, {
		itemIndex: i,
	});
}
