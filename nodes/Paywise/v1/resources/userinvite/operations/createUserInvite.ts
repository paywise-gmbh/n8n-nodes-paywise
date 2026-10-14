import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import type { IExecuteFunctions } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties
export const createUserInviteFields: INodeProperties[] = [
	{
		displayName: 'Input Method',
		name: 'inputMethod',
		type: 'options',
		options: [
			{
				name: 'Form Fields',
				value: 'formFields',
				description: 'Configure properties via form fields',
			},
			{
				name: 'JSON',
				value: 'json',
				description: 'Configure properties via JSON',
			},
		],
		default: 'formFields',
		description: 'Configure how to input user invite data',
	},
	{
		displayName: 'JSON Data',
		name: 'jsonData',
		type: 'json',
		default: `{
  "email": "user@example.com",
  "company": "company-uuid",
  "first_name": "John",
  "last_name": "Doe",
  "success_url": "https://your-domain.com/success",
  "failure_url": "https://your-domain.com/failure"
}`,
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['json'],
			},
		},
		description:
			'User invite data as JSON object. Required fields: email, company, success_url, failure_url.',
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'Email of the user to invite',
	},
	{
		displayName: 'Company ID',
		name: 'company',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'ID of the company to add the user to',
	},
	{
		displayName: 'First Name',
		name: 'first_name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'First name of the user',
	},
	{
		displayName: 'Last Name',
		name: 'last_name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'Last name of the user',
	},
	{
		displayName: 'Success URL',
		name: 'success_url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'URL to redirect the user to after successful invitation acceptance',
	},
	{
		displayName: 'Failure URL',
		name: 'failure_url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputMethod: ['formFields'],
			},
		},
		description: 'URL to redirect the user to if invitation acceptance fails',
	},
];

export async function createUserInvite(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get input method and prepare invite data
		const inputMethod = this.getNodeParameter('inputMethod', 0) as string;
		let inviteData: JsonObject = {};

		if (inputMethod === 'json') {
			// Get data from JSON input
			const jsonData = this.getNodeParameter('jsonData', 0) as string;

			// Parse JSON string to object
			try {
				inviteData = JSON.parse(jsonData);
			} catch (error) {
				throw new NodeOperationError(
					this.getNode(),
					`Invalid JSON data: ${(error as Error).message}`,
				);
			}

			// Validate required fields in JSON
			const requiredFields = ['email', 'company', 'success_url', 'failure_url'];
			for (const field of requiredFields) {
				if (!inviteData[field]) {
					throw new NodeOperationError(
						this.getNode(),
						`Required field "${field}" is missing in JSON data`,
					);
				}
			}
		} else {
			// Get data from form fields
			inviteData = {
				email: this.getNodeParameter('email', 0) as string,
				company: this.getNodeParameter('company', 0) as string,
				success_url: this.getNodeParameter('success_url', 0) as string,
				failure_url: this.getNodeParameter('failure_url', 0) as string,
			};

			// Add optional fields if they exist
			const first_name = this.getNodeParameter('first_name', 0, '') as string;
			if (first_name) {
				inviteData.first_name = first_name;
			}

			const last_name = this.getNodeParameter('last_name', 0, '') as string;
			if (last_name) {
				inviteData.last_name = last_name;
			}
		}

		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'user_invites');

		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: inviteData,
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
