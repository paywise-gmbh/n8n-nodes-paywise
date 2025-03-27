import { IResourceDescription } from '../../interfaces';
import { INodeProperties } from 'n8n-workflow';
import {
	createDebtor,
	createDebtorFields,
	getDebtor,
	getDebtorFields,
	listDebtors,
	listDebtorsFields,
} from './operations';

// Define the debtor resource operations (UI elements)
export const debtorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['debtor'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new debtor',
				action: 'Create a new debtor',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Retrieve a debtor',
				action: 'Get a debtor',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all debtors',
				action: 'List all debtors',
			},
		],
		default: 'list',
	},
	
	// Fields for create operation
	...createDebtorFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['create'],
				resource: ['debtor'],
			},
		},
	})),
	
	// Fields for get operation
	...getDebtorFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['debtor'],
			},
		},
	})),
	
	// Fields for list operation
	...listDebtorsFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['list'],
				resource: ['debtor'],
			},
		},
	})),
];

// Export the description for the resource
export const debtorDescription: IResourceDescription = {
	operations: debtorOperations,
	properties: [],
};

// Mapping from UI operation values to function implementations
export const debtorOperationMapping = {
	create: createDebtor,
	get: getDebtor,
	list: listDebtors,
};

// Export operations for direct access
export {
	createDebtor,
	getDebtor,
	listDebtors,
}; 