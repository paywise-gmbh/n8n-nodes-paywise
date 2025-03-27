import { INodeProperties } from 'n8n-workflow';
import { getInfo, getInfoFields } from './operations';

// Define the info resource operations (UI elements)
export const infoOperations: INodeProperties[] = [
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
				value: 'get',
				description: 'Get API information',
				action: 'Get API information',
			},
		],
		default: 'get',
	},
	
	// Fields for get operation
	...getInfoFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['info'],
			},
		},
	})),
];

// Mapping from UI operation values to function implementations
export const infoOperationMapping = {
	get: getInfo,
};

// Export operations for direct access
export {
	getInfo,
}; 