import { IResourceDescription } from '../../interfaces';
import { infoOperations, infoOperationFields } from './operations';
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
				resource: ['info'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'getInfo',
				description: 'Get API information',
				action: 'Get API information',
			},
		],
		default: 'getInfo',
	},
];

// Create the properties array by adding operation-specific fields with display conditions
const properties: INodeProperties[] = [];

// Add all operation fields with proper display conditions
Object.entries(infoOperationFields).forEach(([operationName, fields]) => {
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
		newField.displayOptions.show.resource = ['info'];
		
		// Add to properties array
		properties.push(newField);
	});
});

// Export the description for the resource
export const infoDescription: IResourceDescription = {
	operations,
	properties,
};

// Export the operations
export { infoOperations }; 