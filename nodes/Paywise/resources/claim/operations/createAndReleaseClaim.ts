import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { IClaimData } from '../claim.interfaces';
import { createClaimFields, mapToClaimData } from './createClaim';
import FormData from 'form-data';

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
	console.log('[createAndReleaseClaim] operation function called');
	
	try {
		// Map node parameters to claim data and get document info
		const claimData = mapToClaimData.call(this);
		const documents = mapDocuments.call(this);
		
		console.log('[createAndReleaseClaim] Data mapped:', {
			hasDebtorId: 'debtorId' in claimData,
			documentCount: documents.length
		});
		
		// Make the API request directly to create the claim
		console.log('[createAndReleaseClaim] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		
		const createOptions = {
			method: 'POST',
			url: `${credentials.baseUrl}/claims/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: claimData,
		};
		
		// First, create the claim
		console.log('[createAndReleaseClaim] Making authenticated API request to create claim');
		const createResponse = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			createOptions,
		);
		
		console.log('[createAndReleaseClaim] Claim created successfully');
		const claim = JSON.parse(createResponse);
		
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
			const contentType = getContentType(fileName);

			// Create a multipart form
			const formData = new FormData();
			formData.append('file', binaryDataBuffer, {
				filename: fileName,
				contentType: contentType,
			});
			
			// Get the form headers
			const formHeaders = formData.getHeaders();
			
			const uploadOptions = {
				method: 'POST',
				url: `${credentials.baseUrl}/claims/${claim.id}/documents/`,
				headers: {
					...formHeaders,
					'Accept': 'application/json',
				},
				body: formData,
			};
			
			console.log(`[createAndReleaseClaim] Uploading document: ${fileName}`);
			await this.helpers.requestWithAuthentication.call(
				this,
				'paywiseApi',
				uploadOptions,
			);
		}
		
		// Finally, release the claim
		const releaseOptions = {
			method: 'PATCH',
			url: `${credentials.baseUrl}/claims/${claim.id}/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: {
				submission_state: 'released',
			},
		};
		
		console.log('[createAndReleaseClaim] Releasing claim');
		const releaseResponse = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			releaseOptions,
		);
		
		console.log('[createAndReleaseClaim] Claim released successfully');
		return JSON.parse(releaseResponse);
	} catch (error) {
		console.error('[createAndReleaseClaim] Error:', error);
		throw error;
	}
} 