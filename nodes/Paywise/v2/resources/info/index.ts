import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { paywiseApiRequest } from '../../transport';

export const infoDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['info'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get API key info',
				description: 'Get the company, environment and scopes of the API key in use',
			},
		],
		default: 'get',
	},
];

export async function executeInfo(this: IExecuteFunctions, _operation: string, i: number) {
	return (await paywiseApiRequest.call(this, 'GET', '/v2/info/', { itemIndex: i })) as IDataObject;
}
