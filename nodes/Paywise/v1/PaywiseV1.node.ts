import { asNodeError } from './apiUtils';
import type { IExecuteFunctions } from 'n8n-workflow';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	JsonObject,
	INodeProperties,
	INodeTypeBaseDescription,
} from 'n8n-workflow';

// Import resource declarations
import { claimOperations, claimOperationMapping } from './resources/claim';

import { debtorOperations, debtorOperationMapping } from './resources/debtor';

import { infoOperations, infoOperationMapping } from './resources/info';

import { companyOperations, companyOperationMapping } from './resources/company';

import { userOperations, userOperationMapping } from './resources/user';

import { tokenOperations, tokenOperationMapping } from './resources/token';

import { userinviteOperations, userinviteOperationMapping } from './resources/userinvite';

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

const versionDescription: INodeTypeDescription = {
	subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
	displayName: 'paywise',
	name: 'paywise',
	group: ['transform'],
	version: 1,
	description: 'Consume paywise API',
	defaults: {
		name: 'paywise',
	},
	inputs: ['main'],
	outputs: ['main'],
	credentials: [
		{
			name: 'paywiseApi',
			required: true,
		},
	],
	documentationUrl: 'https://docs.paywise.de/',
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: [
				{
					name: 'Claim (Case Management API)',
					value: 'claim',
					description: 'Manage claims via the Case Management API',
				},
				{
					name: 'Company (Partner API)',
					value: 'company',
					description: 'Manage companies via the Partner API',
				},
				{
					name: 'Debtor (Case Management API)',
					value: 'debtor',
					description: 'Manage debtors via the Case Management API',
				},
				{
					name: 'Info (Case Management API)',
					value: 'info',
					description: 'Get API information via the Case Management API',
				},
				{
					name: 'Token (Partner API)',
					value: 'token',
					description: 'Manage API tokens via the Partner API',
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
			],
			default: 'info',
		},

		// Resource operations and their fields
		...(claimOperations as INodeProperties[]),
		...(companyOperations as INodeProperties[]),
		...(debtorOperations as INodeProperties[]),
		...(infoOperations as INodeProperties[]),
		...(tokenOperations as INodeProperties[]),
		...(userOperations as INodeProperties[]),
		...(userinviteOperations as INodeProperties[]),
	],
};

/**
 * Frozen node version 1 (paywise API v1). Kept so existing workflows keep running;
 * new workflows use version 2.
 */
export class PaywiseV1 implements INodeType {
	// Icon paths are relative to this file, as the lint rules check them. At runtime n8n
	// resolves icons relative to Paywise.node.ts, so the constructor uses the base icon.
	description: INodeTypeDescription = {
		...versionDescription,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		usableAsTool: true,
		icon: {
			light: 'file:../../../icons/paywise.svg',
			dark: 'file:../../../icons/paywise.dark.svg',
		},
	};

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = { ...baseDescription, ...this.description, icon: baseDescription.icon };
	}

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
			throw new NodeOperationError(
				this.getNode(),
				`Operation "${operation}" for resource "${resource}" is not implemented`,
			);
		}

		// Execute the operation for each item
		for (let i = 0; i < items.length; i++) {
			try {
				const result = await operationFunc.call(this, i);
				returnData.push({
					json: result as JsonObject,
					pairedItem: { item: i },
				});
			} catch (error) {
				throw asNodeError(this.getNode(), error);
			}
		}

		return [returnData];
	}
}
