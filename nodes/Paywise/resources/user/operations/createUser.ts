import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { IUserData } from '../user.interfaces';

// Define operation field properties
export const createUserFields: INodeProperties[] = [
	{
		displayName: 'Input Method',
		name: 'inputMethod',
		type: 'options',
		options: [
			{
				name: 'Form Fields',
				value: 'fields',
				description: 'Configure user using form fields',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Configure user using JSON',
			},
		],
		default: 'fields',
		description: 'Method to use for user creation',
		required: true,
	},
	{
		displayName: 'User JSON',
		name: 'jsonData',
		type: 'json',
		default: '',
		displayOptions: {
			show: {
				inputMethod: ['json'],
			},
		},
		description: 'User data as JSON object. Must include at minimum: email, first_name, last_name, company',
		hint: `Example: {
  "email": "user@example.com",
  "first_name": "Max",
  "last_name": "Mustermann",
  "company": "6196ba03-83f2-46ea-83e1-a087bd0c5acc",
  "skip_email_verification": true
}`,
	},
	// Basic user information - shown only when using fields input method
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@example.com',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'Email address of the user',
	},
	{
		displayName: 'First Name',
		name: 'first_name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'First name of the user',
	},
	{
		displayName: 'Last Name',
		name: 'last_name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'Last name of the user',
	},
	{
		displayName: 'Company ID',
		name: 'company',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		description: 'UUID of the company that the user is going to be part of',
	},
	// Optional fields
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
		options: [
			{
				displayName: 'Skip Email Verification',
				name: 'skip_email_verification',
				type: 'boolean',
				default: false,
				description: 'If true, the user\'s email address will be considered verified without requiring user confirmation. Use only if you already validated the email in your own system.',
			},
		],
	},
	// Notification channels
	{
		displayName: 'Notification Channels',
		name: 'notificationChannels',
		placeholder: 'Add Notification Channel',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		displayOptions: {
			show: {
				inputMethod: ['fields'],
			},
		},
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
							{ name: 'Email', value: 'email' },
							{ name: 'SMS', value: 'sms' },
						],
						default: 'email',
						description: 'Type of notification channel',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Email address or phone number for notifications',
					},
					{
						displayName: 'Notification Types',
						name: 'notification_types',
						type: 'multiOptions',
						options: [
							{ name: 'Claim Created', value: 'claim_created' },
							{ name: 'Claim Paid', value: 'claim_paid' },
							{ name: 'Claim Status Changed', value: 'claim_status_changed' },
						],
						default: ['claim_status_changed'],
						description: 'Types of notifications to send through this channel',
					},
				],
			},
		],
	},
];

export async function createUser(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createUser] operation function called');
	
	try {
		// Determine input method
		const inputMethod = this.getNodeParameter('inputMethod', 0) as string;
		let userData: IUserData;
		
		if (inputMethod === 'json') {
			// Get data from JSON input
			const jsonString = this.getNodeParameter('jsonData', 0) as string;
			
			try {
				userData = JSON.parse(jsonString) as IUserData;
			} catch (e: any) {
				throw new Error('Invalid JSON: ' + e.message);
			}
			
			// Validate JSON input contains required fields
			if (!userData.email) {
				throw new Error('Email is required in JSON');
			}
			
			if (!userData.first_name) {
				throw new Error('First name is required in JSON');
			}
			
			if (!userData.last_name) {
				throw new Error('Last name is required in JSON');
			}
			
			if (!userData.company) {
				throw new Error('Company ID is required in JSON');
			}
			
		} else {
			// Get user data from form fields
			const email = this.getNodeParameter('email', 0) as string;
			const firstName = this.getNodeParameter('first_name', 0) as string;
			const lastName = this.getNodeParameter('last_name', 0) as string;
			const companyId = this.getNodeParameter('company', 0) as string;
			const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as JsonObject;
			const notificationChannels = this.getNodeParameter('notificationChannels', 0, {}) as JsonObject;
			
			// Build user data object
			userData = {
				email,
				first_name: firstName,
				last_name: lastName,
				company: companyId,
			};
			
			// Add optional fields
			if (additionalFields) {
				if (additionalFields.skip_email_verification !== undefined) {
					userData.skip_email_verification = additionalFields.skip_email_verification as boolean;
				}
			}
			
			// Add notification channels
			if (notificationChannels && notificationChannels.channels) {
				const channels = notificationChannels.channels as Array<{
					channel_type: string;
					value: string;
					notification_types: string[];
				}>;
				
				userData.notification_channels = channels.map(channel => ({
					channel_type: channel.channel_type,
					value: channel.value,
					notification_types: channel.notification_types,
				}));
			}
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'users');
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify(userData),
		};
		
		console.log('[createUser] Making authenticated API request to:', url);
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createUser] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createUser] Error:', error);
		throw error;
	}
} 