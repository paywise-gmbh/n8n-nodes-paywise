import {

	getToken,

} from './operations';

import {
	ITokenData,
	ITokenResponse,
} from './token.interfaces';

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

// Export all operations and fields
export {
	// Operations
	getToken,
	ITokenData,
	ITokenResponse,
}; 