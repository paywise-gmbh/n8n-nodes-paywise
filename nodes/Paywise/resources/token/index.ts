import {
	createTokenFields,
	createToken,
	getTokenFields,
	getToken,
	listTokensFields,
	listTokens,
	deleteTokenFields,
	deleteToken,
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
				name: 'Create',
				value: 'create',
				description: 'Create a new API token for a company',
				action: 'Create a token',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an API token',
				action: 'Delete a token',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a token by ID',
				action: 'Get a token',
			},
			{
				name: 'Get Info',
				value: 'getInfo',
				description: 'Get token information',
				action: 'Get token information',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all tokens',
				action: 'List tokens',
			},
		],
		default: 'list',
	},
];

// Export all operations and fields
export {
	// Operations
	createToken,
	getToken,
	deleteToken,
	listTokens,
	
	// Fields
	createTokenFields,
	getTokenFields,
	deleteTokenFields,
	listTokensFields,
	
	// Interfaces
	ITokenData,
	ITokenResponse,
}; 