import { INodeProperties } from 'n8n-workflow';
import {
	getUser,
	getUserFields,
	inviteUser,
	inviteUserFields,
	listUsers,
	listUsersFields,
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
	
	// Fields for get operation
	...getUserFields.map(field => ({
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
	
	// Fields for invite operation
	...inviteUserFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['invite'],
				resource: ['user'],
			},
		},
	})),
	
	// Fields for list operation
	...listUsersFields.map(field => ({
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
	get: getUser,
	invite: inviteUser,
	list: listUsers,
};

// Export operations for direct access
export {
	// Operations
	getUser,
	inviteUser,
	listUsers,
	
	// Interfaces
	IUserData,
	IUserCreateResponse,
	IUserInviteData,
	IUserInviteResponse,
	IUserListResponse,
}; 