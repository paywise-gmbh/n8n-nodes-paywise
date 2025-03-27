import {
	getUserFields,
	getUser,
	inviteUserFields,
	inviteUser,
	listUsersFields,
	listUsers,
} from './operations';

import {
	IUserData,
	IUserCreateResponse,
	IUserInviteData,
	IUserInviteResponse,
	IUserListResponse,
} from './user.interfaces';

// Define the user resource operations
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
				name: 'Get',
				value: 'get',
				description: 'Get a user by ID',
				action: 'Get a user',
			},
			{
				name: 'Invite',
				value: 'invite',
				description: 'Invite a new user to a company',
				action: 'Invite a user',
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
];

// Export all operations and fields
export {
	// Operations
	getUser,
	inviteUser,
	listUsers,
	
	// Fields
	getUserFields,
	inviteUserFields,
	listUsersFields,
	
	// Interfaces
	IUserData,
	IUserCreateResponse,
	IUserInviteData,
	IUserInviteResponse,
	IUserListResponse,
}; 