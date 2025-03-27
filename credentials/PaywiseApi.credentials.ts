import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PaywiseApi implements ICredentialType {
	name = 'paywiseApi';
	displayName = 'Paywise API';
	documentationUrl = 'https://api.paywise.org/v1/docs/';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.paywise.org',
			required: true,
			description: 'The base URL of the Paywise API without any subpaths',
		},
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'The Bearer token for authentication',
		},
		{
			displayName: 'Case Management API Subpath',
			name: 'caseManagementApiSubpath',
			type: 'string',
			default: '/v1',
			required: true,
			description: 'The subpath for the Case Management API',
		},
		{
			displayName: 'Partner API Subpath',
			name: 'partnerApiSubpath',
			type: 'string',
			default: '/partner/v1',
			required: true,
			description: 'The subpath for the Partner API',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiToken}}',
			},
		},
	};
} 