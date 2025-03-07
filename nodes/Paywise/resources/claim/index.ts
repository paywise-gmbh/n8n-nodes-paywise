import { IResourceDescription } from '../../interfaces';
import { claimOperations, claimOperationFields } from './operations';
import { INodeProperties } from 'n8n-workflow';

// Create a combined properties array for all operations
const operations: INodeProperties[] = [
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
				value: 'createClaim',
				description: 'Create a new claim',
				action: 'Create a new claim',
			},
			{
				name: 'Create and Release',
				value: 'createAndReleaseClaim',
				description: 'Create a new claim and release it',
				action: 'Create and release a new claim',
			},
			{
				name: 'Get',
				value: 'getClaim',
				description: 'Retrieve a claim',
				action: 'Get a claim',
			},
			{
				name: 'List',
				value: 'listClaims',
				description: 'List all claims',
				action: 'List all claims',
			},
			{
				name: 'Release',
				value: 'releaseClaim',
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
		default: 'listClaims',
	},
];

// Create the properties array by adding operation-specific fields with display conditions
const properties: INodeProperties[] = [];

// Special handling for createClaim fields - make them available for createAndReleaseClaim too
claimOperationFields['createClaim'].forEach((field) => {
	// Clone the field to not modify the original
	const newField = { ...field };
	
	// Add or update displayOptions to show for both createClaim and createAndReleaseClaim
	newField.displayOptions = newField.displayOptions || {};
	newField.displayOptions.show = newField.displayOptions.show || {};
	newField.displayOptions.show.operation = newField.displayOptions.show.operation || [];
	
	// If operation is already conditional, make sure it's an array
	if (typeof newField.displayOptions.show.operation === 'string') {
		newField.displayOptions.show.operation = [newField.displayOptions.show.operation];
	}
	
	// Show for both operations
	if (!newField.displayOptions.show.operation.includes('createClaim')) {
		newField.displayOptions.show.operation.push('createClaim');
	}
	if (!newField.displayOptions.show.operation.includes('createAndReleaseClaim')) {
		newField.displayOptions.show.operation.push('createAndReleaseClaim');
	}
	
	// Add resource condition 
	newField.displayOptions.show.resource = ['claim'];
	
	// Add to properties array
	properties.push(newField);
});

// Add all fields for other operations with proper display conditions
Object.entries(claimOperationFields).forEach(([operationName, fields]) => {
	// Skip createClaim since we already handled it
	if (operationName === 'createClaim') return;
	
	fields.forEach((field) => {
		// Clone the field to not modify the original
		const newField = { ...field };
		
		// Add or update displayOptions to show only for the specific operation
		newField.displayOptions = newField.displayOptions || {};
		newField.displayOptions.show = newField.displayOptions.show || {};
		newField.displayOptions.show.operation = newField.displayOptions.show.operation || [];
		
		// If operation is already conditional, make sure it's an array
		if (typeof newField.displayOptions.show.operation === 'string') {
			newField.displayOptions.show.operation = [newField.displayOptions.show.operation];
		}
		
		// Add the current operation to the display conditions if not already included
		if (!newField.displayOptions.show.operation.includes(operationName)) {
			newField.displayOptions.show.operation.push(operationName);
		}
		
		// Add resource condition 
		newField.displayOptions.show.resource = ['claim'];
		
		// Add to properties array
		properties.push(newField);
	});
});

// Export the description for the resource
export const claimDescription: IResourceDescription = {
	operations,
	properties,
};

// Export the operations
export { claimOperations }; 