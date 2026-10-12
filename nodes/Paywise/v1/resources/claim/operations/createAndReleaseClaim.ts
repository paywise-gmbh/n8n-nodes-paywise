import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { IClaimData } from '../claim.interfaces';
import { createClaim, createClaimFields, mapToClaimData, validateClaimData } from './createClaim';
import { mapUploadDocumentParams } from './uploadDocument';
import FormData from 'form-data';
import { ApiType, getApiUrl, addCommonHeaders } from '../../../apiUtils';

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
function validateDocuments(this: IExecuteFunctions, documents: Array<{ binary_property: string; file_name: string }>): void {
	if (!documents || documents.length === 0) {
		return; // No documents to validate
	}
	
	documents.forEach((doc, index) => {
		if (!doc.binary_property) {
			throw new NodeOperationError(
				this.getNode(),
				`Document #${index + 1} is missing a binary property name`
			);
		}
		
		// Check if the binary property exists
		const items = this.getInputData();
		if (!items || items.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'No input items found'
			);
		}
		
		const item = items[0];
		if (!item.binary || !item.binary[doc.binary_property]) {
			throw new NodeOperationError(
				this.getNode(),
				`No binary data property "${doc.binary_property}" exists on item!`
			);
		}
		
		// Check file type if a filename is provided
		if (doc.file_name) {
			const ext = doc.file_name.split('.').pop()?.toLowerCase();
			const supportedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'txt'];
			
			if (ext && !supportedExtensions.includes(ext)) {
				throw new NodeOperationError(
					this.getNode(),
					`Document #${index + 1} has unsupported file extension: ${ext}. Supported extensions: ${supportedExtensions.join(', ')}`
				);
			}
		}
	});
}

/**
 * Maps document parameters
 */
export function mapDocuments(this: IExecuteFunctions): Array<{ binary_property: string; file_name: string }> {
	try {
		console.log('[mapDocuments] Starting to map document parameters');
		const inputType = this.getNodeParameter('inputType', 0) as string;
		console.log(`[mapDocuments] Input type is: ${inputType}`);
		
		if (inputType === 'json') {
			// For JSON input, extract documents from JSON data
			try {
				const jsonData = this.getNodeParameter('jsonData', 0, '') as string;
				const parsedData = JSON.parse(jsonData);
				
				if (parsedData && parsedData.documents && Array.isArray(parsedData.documents)) {
					console.log(`[mapDocuments] Found ${parsedData.documents.length} documents in JSON data`);
					
					// Map and validate the documents from JSON
					const mappedDocs = parsedData.documents.map((doc: any, index: number) => {
						if (!doc.binary_property) {
							throw new NodeOperationError(
								this.getNode(),
								`Document #${index + 1} in JSON is missing binary_property`
							);
						}
						
						const mapped = {
							binary_property: doc.binary_property,
							file_name: doc.file_name || '',
						};
						
						console.log(`[mapDocuments] Mapped document ${index+1} from JSON:`, mapped);
						return mapped;
					});
					
					return mappedDocs;
				}
				
				console.log('[mapDocuments] No documents found in JSON data');
				return [];
			} catch (error) {
				console.error('[mapDocuments] Error parsing JSON documents:', error);
				return [];
			}
		}
		
		if (inputType !== 'fields') {
			console.log('[mapDocuments] Not using fields input type, returning empty documents array');
			return [];
		}
		
		// Use a safer approach with try/catch
		try {
			console.log('[mapDocuments] Attempting to get documents parameter');
			
			// First check if the parameter exists
			const hasDocumentsParameter = this.getNodeParameter('documents', 0, null) !== null;
			console.log(`[mapDocuments] Has documents parameter: ${hasDocumentsParameter}`);
			
			if (!hasDocumentsParameter) {
				console.log('[mapDocuments] Documents parameter not found, returning empty array');
				return [];
			}
			
			const documentsCollection = this.getNodeParameter('documents', 0, { documentsValues: [] }) as {
				documentsValues: Array<{
					binary_property: string;
					file_name: string;
				}>;
			};
			
			console.log('[mapDocuments] Documents collection retrieved:', {
				hasCollection: !!documentsCollection,
				hasDocumentsValues: !!(documentsCollection && documentsCollection.documentsValues),
				documentsCount: documentsCollection?.documentsValues?.length || 0
			});
			
			if (!documentsCollection || !documentsCollection.documentsValues || documentsCollection.documentsValues.length === 0) {
				console.log('[mapDocuments] No documents found in collection, returning empty array');
				return [];
			}
			
			// Map and validate the documents
			const mappedDocs = documentsCollection.documentsValues.map((doc, index) => {
				const mapped = {
					binary_property: doc.binary_property || 'data', // Default to 'data' if missing
					file_name: doc.file_name || '',
				};
				
				console.log(`[mapDocuments] Mapped document ${index+1}:`, mapped);
				return mapped;
			});
			
			console.log(`[mapDocuments] Successfully mapped ${mappedDocs.length} documents`);
			return mappedDocs;
		} catch (error) {
			console.error('[mapDocuments] Error accessing documents parameter:', error);
			return [];
		}
	} catch (error) {
		console.error('[mapDocuments] Error:', error);
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
	fileName?: string
): Promise<JsonObject> {
	if (!claimId) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot upload document: Missing claim ID'
		);
	}
	
	if (!binaryProperty) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot upload document: Missing binary property name'
		);
	}
	
	const items = this.getInputData();
	if (!items || items.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'No input items found'
		);
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

	console.log(`[uploadClaimDocument] Preparing to upload document ${finalFileName} (${contentType})`);
	console.log(`[uploadClaimDocument] Buffer length: ${binaryDataBuffer.length} bytes`);
	
	// In n8n, instead of using FormData directly, we need to structure the request differently
	const credentials = await this.getCredentials('paywiseApi');
	
	// Use n8n's built-in multipart/form-data handling
	const options = {
		method: 'POST',
		url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, `claims/${claimId}/documents/`),
		headers: {
			'Accept': 'application/json',
		},
		formData: {
			// Only include the file field as per API documentation
			file: {
				value: binaryDataBuffer,
				options: {
					filename: finalFileName,
					contentType: contentType
				}
			}
		}
	};
	
	// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
	const optionsWithHeaders = addCommonHeaders.call(this, options, 0);
	
	console.log(`[uploadClaimDocument] Sending request to: ${options.url}`);
	try {
		console.log('[uploadClaimDocument] Request options:', JSON.stringify({
			method: options.method,
			url: options.url,
			headers: optionsWithHeaders.headers,
			hasFormData: !!options.formData,
			formDataKeys: options.formData ? Object.keys(options.formData) : []
		}));
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log(`[uploadClaimDocument] Document upload successful`);
		return JSON.parse(response);
	} catch (error) {
		console.error(`[uploadClaimDocument] Document upload failed:`, error);
		// If the error contains response data, log it for debugging
		if ((error as any).response) {
			console.error('[uploadClaimDocument] API error response:', (error as any).response);
		}
		throw error;
	}
}

/**
 * Release an existing claim
 */
async function releaseExistingClaim(this: IExecuteFunctions, claimId: string): Promise<JsonObject> {
	if (!claimId) {
		throw new NodeOperationError(
			this.getNode(),
			'Cannot release claim: Missing claim ID'
		);
	}
	
	const credentials = await this.getCredentials('paywiseApi');
	
	const releaseOptions = {
		method: 'PATCH',
		url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, `claims/${claimId}/`),
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: {
			submission_state: 'released',
		},
	};
	
	// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
	const optionsWithHeaders = addCommonHeaders.call(this, releaseOptions, 0);
	
	console.log('[releaseExistingClaim] Releasing claim');
	const releaseResponse = await this.helpers.requestWithAuthentication.call(
		this,
		'paywiseApi',
		optionsWithHeaders,
	);
	
	return JSON.parse(releaseResponse);
}

export async function createAndReleaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('=====================================================');
	console.log('[createAndReleaseClaim] OPERATION STARTED');
	console.log('=====================================================');
	
	try {
		// Log execution context
		const workflowId = this.getWorkflow().id || 'unknown';
		console.log(`[createAndReleaseClaim] Context: Workflow ID: ${workflowId}`);
		
		// Log input data
		const inputItems = this.getInputData();
		console.log(`[createAndReleaseClaim] Input items count: ${inputItems.length}`);
		if (inputItems.length > 0) {
			console.log('[createAndReleaseClaim] First input item:', {
				hasJson: !!inputItems[0].json,
				hasBinary: !!inputItems[0].binary,
				binaryProperties: inputItems[0].binary ? Object.keys(inputItems[0].binary) : [],
				jsonKeys: inputItems[0].json ? Object.keys(inputItems[0].json) : []
			});
		}
		
		// Step 1: Map node parameters to claim data and get document info
		console.log('[createAndReleaseClaim] Step 1: Mapping parameters...');
		const claimData = mapToClaimData.call(this);
		console.log('[createAndReleaseClaim] Claim data mapped:', {
			hasClaimData: !!claimData,
			dataKeys: claimData ? Object.keys(claimData) : [],
			debtor: claimData?.debtor,
			yourRef: claimData?.your_reference
		});
		
		const documents = mapDocuments.call(this);
		console.log('[createAndReleaseClaim] Documents mapped:', {
			documentCount: documents?.length || 0,
			documents: documents
		});
		
		// Step 2: Validate claim data using imported function from createClaim
		console.log('[createAndReleaseClaim] Step 2: Validating claim data...');
		validateClaimData.call(this, claimData);
		console.log('[createAndReleaseClaim] Claim data validated successfully');
		
		// Step 3: Validate documents
		console.log('[createAndReleaseClaim] Step 3: Validating documents...');
		validateDocuments.call(this, documents);
		console.log('[createAndReleaseClaim] Documents validated successfully');
		
		// Step 4: Create the claim (reusing code pattern from createClaim)
		console.log('[createAndReleaseClaim] Step 4: Creating claim...');
		const credentials = await this.getCredentials('paywiseApi');
		console.log('[createAndReleaseClaim] Using API URL:', credentials.baseUrl);
		
		const createOptions = {
			method: 'POST',
			url: await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims'),
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: claimData,
		};
		
		// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
		const optionsWithHeaders = addCommonHeaders.call(this, createOptions, 0);
		
		console.log('[createAndReleaseClaim] Making API request to create claim...');
		console.log('[createAndReleaseClaim] Request URL:', createOptions.url);
		console.log('[createAndReleaseClaim] Request method:', createOptions.method);
		console.log('[createAndReleaseClaim] Request body keys:', Object.keys(createOptions.body));
		
		const createResponse = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			optionsWithHeaders,
		);
		
		console.log('[createAndReleaseClaim] Claim created successfully');
		const claim = JSON.parse(createResponse);
		console.log('[createAndReleaseClaim] Claim response:', {
			id: claim?.id,
			status: claim?.status,
			submissionState: claim?.submission_state,
			responseKeys: claim ? Object.keys(claim) : []
		});
		
		if (!claim || !claim.id) {
			console.error('[createAndReleaseClaim] ERROR: Missing claim ID in response:', createResponse);
			throw new NodeOperationError(this.getNode(), 'Failed to get valid claim ID from create response');
		}
		
		// Step 5: Upload documents if any (using the helper function)
		if (documents && documents.length > 0) {
			console.log(`[createAndReleaseClaim] Step 5: Uploading ${documents.length} documents...`);
			
			// Log document details for debugging
			documents.forEach((doc, idx) => {
				console.log(`[createAndReleaseClaim] Document ${idx+1} details:`, {
					binaryProperty: doc.binary_property,
					fileName: doc.file_name || 'Not specified',
					hasBinary: inputItems[0]?.binary ? !!inputItems[0].binary[doc.binary_property] : false
				});
			});
			
			// Keep track of upload success and failures
			const uploadResults = {
				success: 0,
				failed: 0,
				errors: [] as string[]
			};
			
			for (const [index, doc] of documents.entries()) {
				if (!doc || !doc.binary_property) {
					console.warn(`[createAndReleaseClaim] Skipping invalid document entry at index ${index}`);
					uploadResults.failed++;
					uploadResults.errors.push(`Document ${index+1}: Invalid document entry`);
					continue;
				}
				
				console.log(`[createAndReleaseClaim] Uploading document ${index+1}/${documents.length}:`, {
					binaryProperty: doc.binary_property,
					fileName: doc.file_name || 'Not specified'
				});
				
				try {
					// Try to access the binary data to verify it exists before upload
					const items = this.getInputData();
					const item = items[0];
					
					if (!item.binary || !item.binary[doc.binary_property]) {
						console.error(`[createAndReleaseClaim] No binary data found for property: ${doc.binary_property}`);
						uploadResults.failed++;
						uploadResults.errors.push(`Document ${index+1}: No binary data found for property ${doc.binary_property}`);
						continue;
					}
					
					const uploadResult = await uploadClaimDocument.call(
						this,
						claim.id,
						doc.binary_property,
						doc.file_name
					);
					
					console.log(`[createAndReleaseClaim] Document ${index+1} uploaded successfully:`, {
						resultKeys: uploadResult ? Object.keys(uploadResult) : [],
						id: uploadResult?.id
					});
					uploadResults.success++;
				} catch (uploadError: any) {
					console.error(`[createAndReleaseClaim] ERROR: Failed to upload document ${index+1}:`, uploadError);
					uploadResults.failed++;
					uploadResults.errors.push(`Document ${index+1}: ${uploadError?.message || 'Unknown error'}`);
					// Continue with other documents even if one fails
				}
			}
			
			// Log summary of document uploads
			console.log('[createAndReleaseClaim] Document upload summary:', uploadResults);
			
			if (uploadResults.failed > 0 && uploadResults.success === 0) {
				console.error('[createAndReleaseClaim] WARNING: All document uploads failed!');
				// We'll continue with releasing the claim even if document uploads failed
			}
		} else {
			console.log('[createAndReleaseClaim] Step 5: No documents to upload, skipping');
		}
		
		// Step 6: Release the claim (using the helper function)
		console.log('[createAndReleaseClaim] Step 6: Releasing claim...');
		console.log(`[createAndReleaseClaim] Releasing claim with ID: ${claim.id}`);
		
		const releasedClaim = await releaseExistingClaim.call(this, claim.id);
		console.log('[createAndReleaseClaim] Claim released successfully');
		console.log('[createAndReleaseClaim] Released claim details:', {
			id: releasedClaim?.id,
			status: releasedClaim?.status,
			submissionState: releasedClaim?.submission_state,
			responseKeys: releasedClaim ? Object.keys(releasedClaim) : []
		});
		
		console.log('=====================================================');
		console.log('[createAndReleaseClaim] OPERATION COMPLETED SUCCESSFULLY');
		console.log('=====================================================');
		
		return releasedClaim;
	} catch (error: any) {
		console.error('=====================================================');
		console.error('[createAndReleaseClaim] OPERATION FAILED WITH ERROR:');
		console.error('=====================================================');
		console.error('[createAndReleaseClaim] Error details:', error);
		
		// Get more meaningful error information if available
		const errorMessage = error?.message || 'Unknown error';
		const errorCode = error?.code || 'N/A';
		const errorStack = error?.stack || 'No stack trace available';
		
		console.error('[createAndReleaseClaim] Error message:', errorMessage);
		console.error('[createAndReleaseClaim] Error code:', errorCode);
		console.error('[createAndReleaseClaim] Stack trace:', errorStack);
		
		// Log API response details if it's an API error
		if (error?.response) {
			try {
				console.error('[createAndReleaseClaim] API response status:', error.response.statusCode);
				console.error('[createAndReleaseClaim] API response body:', typeof error.response.body === 'string' 
					? error.response.body 
					: JSON.stringify(error.response.body, null, 2));
			} catch (e) {
				console.error('[createAndReleaseClaim] Could not parse API error response');
			}
		}
		
		throw error;
	}
}
