import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';

// Define operation field properties
export const uploadDocumentFields: INodeProperties[] = [
	{
		displayName: 'Claim ID',
		name: 'claimId',
		type: 'string',
		default: '',
		required: true,
		description: 'ID of the claim',
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property containing the file data',
	},
];

/**
 * Maps node parameters for uploadDocument operation
 */
export async function mapUploadDocumentParams(this: IExecuteFunctions): Promise<{ 
	claimId: string; 
	binaryPropertyName: string; 
	fileName: string;
	binaryDataBuffer: Buffer;
}> {
	const claimId = this.getNodeParameter('claimId', 0) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;

	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Claim ID is required');
	}

	const items = this.getInputData();
	const item = items[0];

	if (!item.binary || !item.binary[binaryPropertyName]) {
		throw new NodeOperationError(
			this.getNode(),
			`No binary data property "${binaryPropertyName}" exists on item!`,
		);
	}

	const binaryData = item.binary[binaryPropertyName];
	const fileName = binaryData.fileName || 'document.pdf';
	const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);
	
	return {
		claimId,
		binaryPropertyName,
		fileName,
		binaryDataBuffer,
	};
}

export async function uploadDocument(this: IExecuteFunctions): Promise<JsonObject> {
	// Map parameters
	const { claimId, fileName, binaryDataBuffer } = await mapUploadDocumentParams.call(this);
	
	// Use PaywiseClient to upload document to the claim
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	const contentType = client.getContentType(fileName);
	
	return client.uploadClaimDocument(claimId, binaryDataBuffer, fileName, contentType);
} 