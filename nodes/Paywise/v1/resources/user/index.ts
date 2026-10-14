import {
	getUser,
	getUserFields,
	listUsers,
	listUsersFields,
	createUser,
	createUserFields,
} from './operations';

import {
	IUserData,
	IUserCreateResponse,
	IUserInviteData,
	IUserInviteResponse,
	IUserListResponse,
} from './user.interfaces';

// Define the user resource operations (UI elements)
export const userOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['user'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new user directly (API-only onboarding)',
				action: 'Create a user',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a user by ID',
				action: 'Get a user',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all users',
				action: 'List users',
			},
		],
		default: 'list',
	},

	// Fields for create operation
	...createUserFields.map((field) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['create'],
				resource: ['user'],
			},
		},
	})),

	// Fields for get operation
	...getUserFields.map((field) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['user'],
			},
		},
	})),

	// Fields for list operation
	...listUsersFields.map((field) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['list'],
				resource: ['user'],
			},
		},
	})),
];

// Mapping from UI operation values to function implementations
export const userOperationMapping = {
	create: createUser,
	get: getUser,
	list: listUsers,
};

// Export operations for direct access
export {
	// Operations
	createUser,
	getUser,
	listUsers,

	// Interfaces
	IUserData,
	IUserCreateResponse,
	IUserInviteData,
	IUserInviteResponse,
	IUserListResponse,
};
