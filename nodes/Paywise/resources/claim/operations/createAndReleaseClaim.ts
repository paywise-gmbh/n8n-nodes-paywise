import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';
import { IClaimData } from '../claim.interfaces';
import { createClaimFields, mapToClaimData } from './createClaim';

// Define operation field properties, reusing the same fields as createClaim
export const createAndReleaseClaimFields: INodeProperties[] = [
	...createClaimFields,
	// Additional fields specific to createAndReleaseClaim
	{
		displayName: 'Documents',
		name: 'documents',
		placeholder: 'Add Document',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				inputType: ['fields'],
			},
		},
		options: [
			{
				name: 'documentsValues',
				displayName: 'Document',
				values: [
					{
						displayName: 'Binary Property',
						name: 'binary_property',
						type: 'string',
						default: 'data',
						description: 'Name of the binary property containing the file data',
					},
					{
						displayName: 'File Name',
						name: 'file_name',
						type: 'string',
						default: '',
						description: 'Name of the file',
					},
				],
			},
		],
	},
];

/**
 * Maps parameters for document uploads
 */
export function mapDocuments(this: IExecuteFunctions): Array<{ binaryProperty: string; fileName: string }> {
	const inputType = this.getNodeParameter('inputType', 0) as string;
	if (inputType !== 'fields') {
		return [];
	}

	const documentsCollection = this.getNodeParameter('documents', 0, { documentsValues: [] }) as {
		documentsValues: Array<{
			binary_property: string;
			file_name: string;
		}>;
	};

	if (!documentsCollection.documentsValues || documentsCollection.documentsValues.length === 0) {
		return [];
	}

	return documentsCollection.documentsValues.map(doc => ({
		binaryProperty: doc.binary_property,
		fileName: doc.file_name,
	}));
}

export async function createAndReleaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
	// Map node parameters to claim data
	const claimData = mapToClaimData.call(this);
	const documents = mapDocuments.call(this);

	// Create and release the claim using the client
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	const claim = await client.createClaim(claimData);

	if (!claim.id) {
		throw new NodeOperationError(this.getNode(), 'Failed to get valid claim ID from create response');
	}

	// Upload documents if any
	for (const doc of documents) {
		const items = this.getInputData();
		const item = items[0];

		if (!item.binary || !item.binary[doc.binaryProperty]) {
			throw new NodeOperationError(
				this.getNode(),
				`No binary data property "${doc.binaryProperty}" exists on item!`,
			);
		}

		const binaryData = item.binary[doc.binaryProperty];
		const fileName = doc.fileName || binaryData.fileName || 'document.pdf';
		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, doc.binaryProperty);
		const contentType = client.getContentType(fileName);

		await client.uploadClaimDocument(claim.id as string, binaryDataBuffer, fileName, contentType);
	}

	// Release the claim
	return client.releaseClaim(claim.id as string);
} 