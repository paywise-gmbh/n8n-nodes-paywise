import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { IResourceFunctions, IResourceDescription } from '../interfaces';

export const infoDescription: IResourceDescription = {
	operations: [
		{
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			displayOptions: {
				show: {
					resource: ['info'],
				},
			},
			options: [
				{
					name: 'Get',
					value: 'getInfo',
					description: 'Get API information',
					action: 'Get API information',
				},
			],
			default: 'getInfo',
		},
	],
	properties: [],
};

export const infoOperations: IResourceFunctions = {
	async getInfo(this: IExecuteFunctions): Promise<JsonObject> {
		const credentials = await this.getCredentials('paywiseApi');
		const options = {
			method: 'GET',
			url: `${credentials.baseUrl}/info/`,
			headers: {
				'Accept': 'application/json',
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		return JSON.parse(response);
	},
}; 