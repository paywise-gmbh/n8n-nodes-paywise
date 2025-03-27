import { getToken } from './operations';
import {
	ITokenData,
	ITokenResponse,
} from './token.interfaces';
import { INodeProperties } from 'n8n-workflow';

// Define the token resource operations
export const tokenOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['token'],
			},
		},
		options: [
			{
				name: 'Get Current Token Info',
				value: 'get',
				description: 'Get information about the current API token',
				action: 'Get current token information',
			}
		],
		default: 'get',
	},
];

// Mapping from UI operation values to function implementations
export const tokenOperationMapping = {
	get: getToken,
};

// Export operations for direct access
export {
	getToken,
	ITokenData,
	ITokenResponse,
}; 