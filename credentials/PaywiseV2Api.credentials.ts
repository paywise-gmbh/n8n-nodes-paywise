import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PaywiseV2Api implements ICredentialType {
	name = 'paywiseV2Api';

	displayName = 'Paywise V2 API';

	icon: Icon = { light: 'file:../icons/paywise.svg', dark: 'file:../icons/paywise.dark.svg' };

	documentationUrl = 'https://docs.paywise.de/api-docs/essentials/authentication-and-environments';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Production',
					value: 'production',
					description: 'https://api.paywise.de',
				},
				{
					name: 'Sandbox',
					value: 'sandbox',
					description: 'https://api-sandbox.paywise.de, for keys starting with pw_sbx_',
				},
				{
					name: 'Custom',
					value: 'custom',
					description: 'Another base URL, e.g. a staging system',
				},
			],
			default: 'production',
			description: 'The paywise environment the API key belongs to',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api-staging.paywise.de',
			description: 'Base URL without any path, e.g. without /v2',
			displayOptions: {
				show: {
					environment: ['custom'],
				},
			},
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Company API key, created in the paywise portal under API keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "custom" ? $credentials.baseUrl.replace(/\\/+$/, "") : $credentials.environment === "sandbox" ? "https://api-sandbox.paywise.de" : "https://api.paywise.de"}}',
			url: '/v2/info/',
			method: 'GET',
		},
	};
}
