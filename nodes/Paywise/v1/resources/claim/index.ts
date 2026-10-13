import { INodeProperties } from 'n8n-workflow';
import {
	createClaim,
	createClaimFields,
	releaseClaim,
	releaseClaimFields,
	createAndReleaseClaim, 
	createAndReleaseClaimFields,
	getClaim,
	getClaimFields,
	listClaims,
	listClaimsFields,
	uploadDocument,
	uploadDocumentFields,
} from './operations';

// Define the claim resource operations (UI elements)
export const claimOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['claim'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new claim',
				action: 'Create a new claim',
			},
			{
				name: 'Create and Release',
				value: 'createAndRelease',
				description: 'Create a new claim and release it',
				action: 'Create and release a new claim',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a claim',
				action: 'Get a claim',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all claims',
				action: 'List all claims',
			},
			{
				name: 'Release',
				value: 'release',
				description: 'Release claim for processing',
				action: 'Release a claim',
			},
			{
				name: 'Upload Document',
				value: 'uploadDocument',
				description: 'Upload a document to a claim',
				action: 'Upload a document to a claim',
			},
		],
		default: 'list',
	},
	
	// Fields for create operation
	...createClaimFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['create', 'createAndRelease'],
				resource: ['claim'],
			},
		},
	})),
	
	// Fields for release operation
	...releaseClaimFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['release'],
				resource: ['claim'],
			},
		},
	})),
	
	// Fields for get operation
	...getClaimFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['claim'],
			},
		},
	})),
	
	// Fields for list operation
	...listClaimsFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['list'],
				resource: ['claim'],
			},
		},
	})),
	
	// Fields for createAndRelease operation (extra fields not in create)
	...createAndReleaseClaimFields
		.filter(field => !createClaimFields.some(f => f.name === field.name))
		.map(field => ({
			...field,
			displayOptions: {
				...field.displayOptions,
				show: {
					...(field.displayOptions?.show || {}),
					operation: ['createAndRelease'],
					resource: ['claim'],
				},
			},
		})),
		
	// Fields for uploadDocument operation
	...uploadDocumentFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['uploadDocument'],
				resource: ['claim'],
			},
		},
	})),
];

// Mapping from UI operation values to function implementations
export const claimOperationMapping = {
	create: createClaim,
	get: getClaim,
	list: listClaims,
	release: releaseClaim,
	createAndRelease: createAndReleaseClaim,
	uploadDocument: uploadDocument,
};

// Export operations for direct access
export {
	createClaim,
	releaseClaim,
	createAndReleaseClaim,
	getClaim,
	listClaims,
	uploadDocument,
}; 