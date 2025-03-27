import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { IUserInviteData } from '../userinvite.interfaces';

// Define operation field properties
export const createUserInviteFields: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		description: 'Email of the user to invite',
	},
	{
		displayName: 'Company ID',
		name: 'company',
		type: 'string',
		default: '',
		required: true,
		description: 'UUID of the company the user will join',
	},
	{
		displayName: 'Success URL',
		name: 'success_url',
		type: 'string',
		default: '',
		required: true,
		description: 'URL for successful onboarding',
	},
	{
		displayName: 'Failure URL',
		name: 'failure_url',
		type: 'string',
		default: '',
		required: true,
		description: 'URL for failed onboarding',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		options: [
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
				description: 'First name of the user to invite',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				description: 'Last name of the user to invite',
			},
		],
	},
];

export async function createUserInvite(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createUserInvite] operation function called');
	
	try {
		// Get parameters
		const inviteParams = this.getNodeParameter('inviteParams', 0, {}) as IUserInviteData;
		const additionalFields = this.getNodeParameter('additionalFields', 0, {}) as Partial<IUserInviteData>;
		
		// Check required fields
		if (!inviteParams.email) {
			throw new Error('Email is required');
		}
		if (!inviteParams.company) {
			throw new Error('Company ID is required');
		}
		if (!inviteParams.success_url) {
			throw new Error('Success URL is required');
		}
		if (!inviteParams.failure_url) {
			throw new Error('Failure URL is required');
		}
		
		// Build the invite data
		const inviteData: IUserInviteData = {
			email: inviteParams.email,
			company: inviteParams.company,
			success_url: inviteParams.success_url,
			failure_url: inviteParams.failure_url,
		};
		
		// Add optional fields if provided
		if (additionalFields.first_name) {
			inviteData.first_name = additionalFields.first_name;
		}
		if (additionalFields.last_name) {
			inviteData.last_name = additionalFields.last_name;
		}
		
		// Get API URL
		const url = await getApiUrl.call(
			this,
			ApiType.PARTNER,
			'userinvites',
		);
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(inviteData),
		};
		
		console.log('[createUserInvite] Making authenticated API request to:', url);
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createUserInvite] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createUserInvite] Error:', error);
		throw error;
	}
} 