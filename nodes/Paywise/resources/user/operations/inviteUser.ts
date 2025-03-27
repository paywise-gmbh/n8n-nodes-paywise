import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { IUserInviteData } from '../user.interfaces';

// Define operation field properties
export const inviteUserFields: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'companyId',
		type: 'string',
		default: '',
		description: 'ID of the company the user will be invited to',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		description: 'Email address of the user to invite',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		default: '',
		description: 'First name of the user',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		default: '',
		description: 'Last name of the user',
	},
	{
		// Notification channels (optional)
		displayName: 'Notification Channels',
		name: 'notificationChannels',
		placeholder: 'Add Notification Channel',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				name: 'channels',
				displayName: 'Channels',
				values: [
					{
						displayName: 'Channel Type',
						name: 'channel_type',
						type: 'options',
						options: [
							{ name: 'Email', value: 'EMAIL' },
						],
						default: 'EMAIL',
						description: 'Type of notification channel',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Email address for notifications',
					},
					{
						displayName: 'Notification Types',
						name: 'notification_types',
						type: 'multiOptions',
						options: [
							{ name: 'Status Updates', value: 'STATUS_UPDATE' },
							{ name: 'Client Requests', value: 'REQUESTS_TO_CLIENT' },
							{ name: 'Statements', value: 'STATEMENTS' },
						],
						default: ['STATUS_UPDATE', 'REQUESTS_TO_CLIENT', 'STATEMENTS'],
						description: 'Types of notifications to receive',
					},
				],
			},
		],
	},
];

export async function inviteUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[inviteUser] operation function called');
	
	try {
		// Get input parameters from userInviteDetails collection
		const userInviteDetails = this.getNodeParameter('userInviteDetails', 0, {});
		
		// Validate required fields
		if (!userInviteDetails.companyId) {
			throw new Error('Company ID is required');
		}
		
		if (!userInviteDetails.email) {
			throw new Error('Email is required');
		}
		
		if (!userInviteDetails.firstName) {
			throw new Error('First name is required');
		}
		
		if (!userInviteDetails.lastName) {
			throw new Error('Last name is required');
		}
		
		// Build user data
		const userData: IUserInviteData = {
			email: userInviteDetails.email as string,
			first_name: userInviteDetails.firstName as string,
			last_name: userInviteDetails.lastName as string,
			company_id: userInviteDetails.companyId as string,
		};
		
		// Get notification channels
		if (userInviteDetails.notificationChannels && userInviteDetails.notificationChannels.channels) {
			const channels = userInviteDetails.notificationChannels.channels as Array<{
				channel_type: string;
				value: string;
				notification_types: string[];
			}>;
			
			userData.notification_channels = channels;
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'users/invite');
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(userData),
		};
		
		console.log('[inviteUser] Making authenticated API request to:', url);
		console.log('[inviteUser] Request body:', userData);
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[inviteUser] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[inviteUser] Error inviting user:', error);
		throw error;
	}
} 