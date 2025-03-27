import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	JsonObject,
} from 'n8n-workflow';

// Import resource declarations
import {
	claimOperations,
	claimOperationMapping,
} from './resources/claim';

import {
	debtorOperations,
	debtorOperationMapping,
} from './resources/debtor';

import {
	infoOperations,
	infoOperationMapping,
} from './resources/info';

import {
	companyOperations,
	companyOperationMapping,
} from './resources/company';

import {
	userOperations,
	userOperationMapping,
} from './resources/user';

import {
	tokenOperations,
	tokenOperationMapping,
} from './resources/token';

import {
	userinviteOperations,
	userinviteOperationMapping,
} from './resources/userinvite';

// Define a type for the operation function
type OperationFunction = (this: IExecuteFunctions, index: number) => Promise<JsonObject>;

// Define a type for the operation mapping
interface OperationMapping {
	[key: string]: OperationFunction;
}

// Define resource operation mappings type
interface ResourceMappings {
	[resource: string]: OperationMapping;
}

export class Paywise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Paywise',
		name: 'paywise',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
		icon: 'file:paywise-logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Consume Paywise API',
		defaults: {
			name: 'Paywise',
			color: '#18559d',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'paywiseApi',
				required: true,
			},
		],
		documentationUrl: 'https://api.paywise.org/v1/docs/',
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Claim',
						value: 'claim',
					},
					{
						name: 'Debtor',
						value: 'debtor',
					},
					{
						name: 'Info',
						value: 'info',
					},
					{
						name: 'Company (Partner API)',
						value: 'company',
						description: 'Manage companies via the Partner API',
					},
					{
						name: 'User (Partner API)',
						value: 'user',
						description: 'Manage users via the Partner API',
					},
					{
						name: 'User Invite (Partner API)',
						value: 'userinvite',
						description: 'Manage user invites via the Partner API',
					},
					{
						name: 'Token (Partner API)',
						value: 'token',
						description: 'Manage API tokens via the Partner API',
					},
				],
				default: 'info',
			},

			// Resource operations and their fields
			...claimOperations,
			...companyOperations,
			...debtorOperations,
			...infoOperations,
			...tokenOperations,
			...userOperations,
			...userinviteOperations,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get the resource and operation selected by the user
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Resource operation mappings
		const operationMappings: ResourceMappings = {
			claim: claimOperationMapping,
			debtor: debtorOperationMapping,
			info: infoOperationMapping,
			company: companyOperationMapping,
			user: userOperationMapping,
			token: tokenOperationMapping,
			userinvite: userinviteOperationMapping,
		};

		// Look up the function to execute based on resource and operation
		const operationMap = operationMappings[resource];
		
		if (!operationMap) {
			throw new NodeOperationError(this.getNode(), `Resource "${resource}" is not implemented`);
		}
		
		const operationFunc = operationMap[operation];
		
		if (!operationFunc) {
			throw new NodeOperationError(this.getNode(), `Operation "${operation}" for resource "${resource}" is not implemented`);
		}

		// Execute the operation for each item
		for (let i = 0; i < items.length; i++) {
			try {
				const result = await operationFunc.call(this, i);
				returnData.push({
					json: result as JsonObject,
				});
			} catch (error) {
				throw error;
			}
		}

		return [returnData];
	}
} 