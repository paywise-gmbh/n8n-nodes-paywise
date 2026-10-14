import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { mapToClaimData, validateClaimData } from './createClaim';
import {
	ApiType,
	getApiUrl,
	addCommonHeaders,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties specific to createAndReleaseClaim
export const createAndReleaseClaimFields: INodeProperties[] = [
	// Add inputType field at the top level
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		options: [
			{
				name: 'JSON',
				value: 'json',
				description: 'Input JSON object',
			},
			{
				name: 'Fields',
				value: 'fields',
				description: 'Input individual fields',
			},
		],
		default: 'fields',
		description: 'Whether to input data via fields or JSON object',
		displayOptions: {
			show: {
				resource: ['claim'],
			},
		},
	},
	// Add JSON data field
	{
		displayName: 'JSON Data',
		name: 'jsonData',
		type: 'json',
		default: `{
  "debtor": "c33d083e-ed26-4996-877d-b9dc23416268",
  "your_reference": "INV-2024-001",
  "main_claim_amount": {
    "value": "1000.00",
    "currency": "EUR"
  },
  "total_claim_amount": {
    "value": "1200.00",
    "currency": "EUR"
  },
  "due_date": "2024-02-15",
  "subject_matter": "Software Development Services",
  "documents": [
    {
      "binary_property": "data",
      "file_name": "invoice.pdf"
    }
  ]
}`,
		required: true,
		displayOptions: {
			show: {
				inputType: ['json'],
				resource: ['claim'],
			},
		},
		description: 'Claim data as JSON object including documents to upload',
	},
	// Only include the Documents field which is specific to createAndReleaseClaim
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
				resource: ['claim'],
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
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description: 'Whether to act on behalf of a client company when making this request',
		displayOptions: {
			show: {
				resource: ['claim'],
			},
		},
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
				resource: ['claim'],
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
 * Validates document parameters
 */
function validateDocuments(
	this: IExecuteFunctions,
	documents: Array<{ binary_property: string; file_name: string }>,
): void {
	if (!documents || documents.length === 0) {
		return; // No documents to validate
	}

	documents.forEach((doc, index) => {
		if (!doc.binary_property) {
			throw new NodeOperationError(
				this.getNode(),
				`Document #${index + 1} is missing a binary property name`,
			);
		}

		// Check if the binary property exists
		const items = this.getInputData();
		if (!items || items.length === 0) {
			throw new NodeOperationError(this.getNode(), 'No input items found');
		}

		const item = items[0];
		if (!item.binary || !item.binary[doc.binary_property]) {
			throw new NodeOperationError(
				this.getNode(),
				`No binary data property "${doc.binary_property}" exists on item!`,
			);
		}

		// Check file type if a filename is provided
		if (doc.file_name) {
			const ext = doc.file_name.split('.').pop()?.toLowerCase();
			const supportedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];

			if (ext && !supportedExtensions.includes(ext)) {
				throw new NodeOperationError(
					this.getNode(),
					`Document #${index + 1} has unsupported file extension: ${ext}. Supported extensions: ${supportedExtensions.join(', ')}`,
				);
			}
		}
	});
}

/**
 * Maps document parameters
 */
export function mapDocuments(
	this: IExecuteFunctions,
): Array<{ binary_property: string; file_name: string }> {
	try {
		const inputType = this.getNodeParameter('inputType', 0) as string;

		if (inputType === 'json') {
			// For JSON input, extract documents from JSON data
			try {
				const jsonData = this.getNodeParameter('jsonData', 0, '') as string;
				const parsedData = JSON.parse(jsonData);

				if (parsedData && parsedData.documents && Array.isArray(parsedData.documents)) {
					// Map and validate the documents from JSON
					const mappedDocs = parsedData.documents.map((doc: IDataObject, index: number) => {
						if (!doc.binary_property) {
							throw new NodeOperationError(
								this.getNode(),
								`Document #${index + 1} in JSON is missing binary_property`,
							);
						}

						const mapped = {
							binary_property: doc.binary_property,
							file_name: doc.file_name || '',
						};
						return mapped;
					});

					return mappedDocs;
				}
				return [];
			} catch {
				return [];
			}
		}

		if (inputType !== 'fields') {
			return [];
		}

		// Use a safer approach with try/catch
		try {
			// First check if the parameter exists
			const hasDocumentsParameter = this.getNodeParameter('documents', 0, null) !== null;

			if (!hasDocumentsParameter) {
				return [];
			}

			const documentsCollection = this.getNodeParameter('documents', 0, {
				documentsValues: [],
			}) as {
				documentsValues: Array<{
					binary_property: string;
					file_name: string;
				}>;
			};

			if (
				!documentsCollection ||
				!documentsCollection.documentsValues ||
				documentsCollection.documentsValues.length === 0
			) {
				return [];
			}

			// Map and validate the documents
			const mappedDocs = documentsCollection.documentsValues.map((doc) => {
				const mapped = {
					binary_property: doc.binary_property || 'data', // Default to 'data' if missing
					file_name: doc.file_name || '',
				};
				return mapped;
			});
			return mappedDocs;
		} catch {
			return [];
		}
	} catch {
		return [];
	}
}

/**
 * Upload a document to an existing claim
 */
async function uploadClaimDocument(
	this: IExecuteFunctions,
	claimId: string,
	binaryProperty: string,
	fileName?: string,
): Promise<JsonObject> {
	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Cannot upload document: Missing claim ID');
	}

	if (!binaryProperty) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot upload document: Missing binary property name',
		);
	}

	const items = this.getInputData();
	if (!items || items.length === 0) {
		throw new NodeOperationError(this.getNode(), 'No input items found');
	}

	const item = items[0];
	if (!item.binary || !item.binary[binaryProperty]) {
		throw new NodeOperationError(
			this.getNode(),
			`No binary data property "${binaryProperty}" exists on item!`,
		);
	}

	const binaryData = item.binary[binaryProperty];
	const finalFileName = fileName || (binaryData && binaryData.fileName) || 'document.pdf';
	const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryProperty);
	const contentType = getContentType(finalFileName);

	// Multipart upload; paywiseV1Request builds the form data
	const options = {
		method: 'POST',
		url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, `claims/${claimId}/documents/`),
		headers: {
			Accept: 'application/json',
		},
		formData: {
			// Only include the file field as per API documentation
			file: {
				value: binaryDataBuffer,
				options: {
					filename: finalFileName,
					contentType: contentType,
				},
			},
		},
	};

	// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
	const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
	try {
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}

/**
 * Release an existing claim
 */
async function releaseExistingClaim(this: IExecuteFunctions, claimId: string): Promise<JsonObject> {
	if (!claimId) {
		throw new NodeOperationError(this.getNode(), 'Cannot release claim: Missing claim ID');
	}

	const releaseOptions = {
		method: 'PATCH',
		url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, `claims/${claimId}/`),
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: {
			submission_state: 'released',
		},
	};

	// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
	const optionsWithHeaders = addCommonHeaders.call(this, releaseOptions, 0);
	const releaseResponse = await paywiseV1Request.call(this, optionsWithHeaders);

	return JSON.parse(releaseResponse);
}

export async function createAndReleaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Step 1: Map node parameters to claim data and get document info
		const claimData = mapToClaimData.call(this);

		const documents = mapDocuments.call(this);

		// Step 2: Validate claim data using imported function from createClaim
		validateClaimData.call(this, claimData);

		// Step 3: Validate documents
		validateDocuments.call(this, documents);

		// Step 4: Create the claim (reusing code pattern from createClaim)
		const createOptions = {
			method: 'POST',
			url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims'),
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
			body: claimData,
		};

		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, createOptions, 0);

		const createResponse = await paywiseV1Request.call(this, optionsWithHeaders);
		const claim = JSON.parse(createResponse);

		if (!claim || !claim.id) {
			throw new NodeOperationError(
				this.getNode(),
				'Failed to get valid claim ID from create response',
			);
		}

		// Step 5: Upload documents if any (using the helper function)
		if (documents && documents.length > 0) {
			// Keep track of upload success and failures
			const uploadResults = {
				success: 0,
				failed: 0,
				errors: [] as string[],
			};

			for (const [index, doc] of documents.entries()) {
				if (!doc || !doc.binary_property) {
					uploadResults.failed++;
					uploadResults.errors.push(`Document ${index + 1}: Invalid document entry`);
					continue;
				}

				try {
					// Try to access the binary data to verify it exists before upload
					const items = this.getInputData();
					const item = items[0];

					if (!item.binary || !item.binary[doc.binary_property]) {
						uploadResults.failed++;
						uploadResults.errors.push(
							`Document ${index + 1}: No binary data found for property ${doc.binary_property}`,
						);
						continue;
					}

					await uploadClaimDocument.call(this, claim.id, doc.binary_property, doc.file_name);
					uploadResults.success++;
				} catch (uploadError) {
					uploadResults.failed++;
					uploadResults.errors.push(
						`Document ${index + 1}: ${(uploadError as Error)?.message || 'Unknown error'}`,
					);
					// Continue with other documents even if one fails
				}
			}

			// The claim is released even if document uploads failed.
		}

		// Step 6: Release the claim (using the helper function)

		const releasedClaim = await releaseExistingClaim.call(this, claim.id);

		return releasedClaim;
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
