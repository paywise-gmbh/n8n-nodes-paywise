import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
	JsonObject,
} from 'n8n-workflow';

import { PaywiseApiError } from './interfaces';
import { claimOperations, claimDescription } from './resources/claim';
import { debtorOperations, debtorDescription } from './resources/debtor';
import { infoOperations, infoDescription } from './resources/info';

export class Paywise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Paywise',
		name: 'paywise',
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
			// Resource selector
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
				],
				default: 'debtor',
			},
			// Operations for each resource
			...claimDescription.operations,
			...debtorDescription.operations,
			...infoDescription.operations,
			// Fields for each operation
			...claimDescription.properties,
			...debtorDescription.properties,
			...infoDescription.properties,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		
		console.log(`[Paywise.node] Executing operation: ${resource}.${operation}`);

		try {
			let result: JsonObject;
			let operationFunction: Function | undefined;

			// Execute the operation based on the resource type
			switch (resource) {
				case 'claim':
					console.log('[Paywise.node] Claim operations available:', Object.keys(claimOperations));
					operationFunction = claimOperations[operation];
					console.log(`[Paywise.node] Found operation function for ${operation}:`, !!operationFunction);
					
					if (!operationFunction) {
						throw new Error(`Operation function not found: ${operation}`);
					}
					
					result = await operationFunction.call(this);
					break;
					
				case 'debtor':
					console.log('[Paywise.node] Debtor operations available:', Object.keys(debtorOperations));
					operationFunction = debtorOperations[operation];
					console.log(`[Paywise.node] Found operation function for ${operation}:`, !!operationFunction);
					
					if (!operationFunction) {
						throw new Error(`Operation function not found: ${operation}`);
					}
					
					result = await operationFunction.call(this);
					break;
					
				case 'info':
					console.log('[Paywise.node] Info operations available:', Object.keys(infoOperations));
					operationFunction = infoOperations[operation];
					console.log(`[Paywise.node] Found operation function for ${operation}:`, !!operationFunction);
					
					if (!operationFunction) {
						throw new Error(`Operation function not found: ${operation}`);
					}
					
					result = await operationFunction.call(this);
					break;
					
				default:
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`);
			}

			console.log('[Paywise.node] Operation completed successfully');
			returnData.push({ json: result });
		} catch (error) {
			console.error('[Paywise.node] Error during execution:', error);
			
			const paywiseError = error as PaywiseApiError;
			if (paywiseError.response) {
				throw new NodeApiError(this.getNode(), paywiseError as unknown as JsonObject);
			}
			throw new NodeOperationError(this.getNode(), `Failed to ${operation}: ` + paywiseError.message);
		}

		return [returnData];
	}
} 