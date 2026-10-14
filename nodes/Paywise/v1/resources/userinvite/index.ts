import { INodeProperties } from 'n8n-workflow';
import {
	getUserInvite,
	getUserInviteFields,
	getOnboardedUser,
	getOnboardedUserFields,
	createUserInvite,
	createUserInviteFields,
} from './operations';

import {
	IUserInviteData,
	IUserInviteResponse,
	IUserInviteUserResponse,
} from './userinvite.interfaces';

// Define the userinvite resource operations (UI elements)
export const userinviteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['userinvite'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new user invite',
				action: 'Create a user invite',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a user invite by ID',
				action: 'Get a user invite',
			},
			{
				name: 'Get Onboarded User',
				value: 'getOnboardedUser',
				description: 'Get the user who was onboarded from an invite',
				action: 'Get onboarded user',
			},
		],
		default: 'create',
	},

	// Fields for create operation
	...createUserInviteFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['create'],
				resource: ['userinvite'],
			},
		},
	})),

	// Fields for get operation
	...getUserInviteFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['userinvite'],
			},
		},
	})),

	// Fields for get onboarded user operation
	...getOnboardedUserFields.map((field: INodeProperties) => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['getOnboardedUser'],
				resource: ['userinvite'],
			},
		},
	})),
];

// Mapping from UI operation values to function implementations
export const userinviteOperationMapping = {
	create: createUserInvite,
	get: getUserInvite,
	getOnboardedUser: getOnboardedUser,
};

// Export operations for direct access
export {
	// Operations
	createUserInvite,
	getUserInvite,
	getOnboardedUser,

	// Interfaces
	IUserInviteData,
	IUserInviteResponse,
	IUserInviteUserResponse,
};
