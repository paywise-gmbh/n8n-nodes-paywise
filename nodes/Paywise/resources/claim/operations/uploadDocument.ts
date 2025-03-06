import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import FormData from 'form-data';

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
 * Helper function to determine content type from file name
 */
function getContentType(fileName: string): string {
	const fileExtension = fileName.split('.').pop()?.toLowerCase();
	switch (fileExtension) {
		case 'pdf':
			return 'application/pdf';
		case 'jpg':
		case 'jpeg':
			return 'image/jpeg';
		case 'png':
			return 'image/png';
		case 'docx':
			return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
		case 'doc':
			return 'application/msword';
		case 'txt':
			return 'text/plain';
		default:
			return 'application/octet-stream';
	}
}

/**
 * Maps node parameters for uploadDocument operation
 */
export async function mapUploadDocumentParams(this: IExecuteFunctions): Promise<{ 
	claimId: string; 
	binaryPropertyName: string; 
	fileName: string;
	binaryDataBuffer: Buffer;
	contentType: string;
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
	const contentType = getContentType(fileName);
	
	return {
		claimId,
		binaryPropertyName,
		fileName,
		binaryDataBuffer,
		contentType,
	};
}

export async function uploadDocument(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[uploadDocument] operation function called');
	
	try {
		// Map parameters
		const { claimId, fileName, binaryDataBuffer, contentType } = await mapUploadDocumentParams.call(this);
		console.log('[uploadDocument] Parameters mapped:', { claimId, fileName, contentType });
		
		// Make the API request directly
		console.log('[uploadDocument] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		// Create a multipart form
		const formData = new FormData();
		formData.append('file', binaryDataBuffer, {
			filename: fileName,
			contentType: contentType,
		});
		
		// Get the form headers
		const formHeaders = formData.getHeaders();
		
		const options = {
			method: 'POST',
			url: `${credentials.baseUrl}/claims/${claimId}/documents/`,
			headers: {
				...formHeaders,
				'Accept': 'application/json',
			},
			body: formData,
		};
		
		console.log('[uploadDocument] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[uploadDocument] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[uploadDocument] Error:', error);
		throw error;
	}
} 