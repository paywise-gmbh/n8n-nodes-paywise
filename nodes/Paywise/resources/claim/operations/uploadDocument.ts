import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import FormData from 'form-data';
import { ApiType, getApiUrl, addActOnBehalfOfClientHeader } from '../../../apiUtils';

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
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description: 'Whether to act on behalf of a client company when making this request',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'ID of the user to act on behalf of',
		required: true,
		displayOptions: {
			show: {
				actOnBehalfOfClient: [true],
			},
		},
	},
];

/**
 * Helper function to determine content type from file name
 */
function getContentType(fileName: string): string {
	if (!fileName) return 'application/octet-stream';
	
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
		console.log(`[uploadDocument] Buffer length: ${binaryDataBuffer.length} bytes`);
		
		// Make the API request using n8n's built-in multipart/form-data handling
		console.log('[uploadDocument] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		// Use n8n's built-in multipart/form-data handling
		const options = {
			method: 'POST',
			url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, `claims/${claimId}/documents`),
			headers: {
				'Accept': 'application/json',
			},
			formData: {
				// Only include the file field as per API documentation
				file: {
					value: binaryDataBuffer,
					options: {
						filename: fileName,
						contentType: contentType
					}
				}
			}
		};
		
		// Add X-User-Id header if acting on behalf of client
		const optionsWithHeaders = addActOnBehalfOfClientHeader.call(this, options, 0);
		
		console.log('[uploadDocument] Request prepared:', JSON.stringify({
			method: options.method,
			url: options.url,
			headers: optionsWithHeaders.headers,
			hasFormData: !!options.formData,
			formDataKeys: options.formData ? Object.keys(options.formData) : []
		}));
		
		console.log('[uploadDocument] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[uploadDocument] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[uploadDocument] Error:', error);
		// If the error contains response data, log it for debugging
		if ((error as any).response) {
			console.error('[uploadDocument] API error response:', (error as any).response);
		}
		throw error;
	}
} 