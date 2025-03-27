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
import { 
	operations as newOperations,
	operationFields,
} from './resources';
import { ApiType, getApiUrl } from './apiUtils';

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
						name: 'Company',
						value: 'company',
						description: 'Manage companies (Partner API)',
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
						name: 'Token',
						value: 'token',
						description: 'Manage API tokens (Partner API)',
					},
					{
						name: 'User',
						value: 'user',
						description: 'Manage users (Partner API)',
					},
				],
				default: 'debtor',
			},
			
			// Legacy resource operations (to be replaced)
			...claimDescription.operations,
			...debtorDescription.operations,
			...infoDescription.operations,
			
			// New unified operations structure
			...newOperations,
			
			// Legacy resource fields (to be replaced)
			...claimDescription.properties,
			...debtorDescription.properties,
			...infoDescription.properties,
			
			// New resources fields with displayOptions
			// Company fields
			{
				displayName: 'Company Data',
				name: 'companyData',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['create'],
					},
				},
				options: operationFields.company.create,
			},
			{
				displayName: 'Company Parameters',
				name: 'companyParams',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['get'],
					},
				},
				options: operationFields.company.get,
			},
			{
				displayName: 'Company List Options',
				name: 'companyListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['list'],
					},
				},
				options: operationFields.company.list,
			},
			
			// User fields
			{
				displayName: 'User Parameters',
				name: 'userParams',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['get'],
					},
				},
				options: operationFields.user.get,
			},
			{
				displayName: 'User Invite Details',
				name: 'userInviteDetails',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['invite'],
					},
				},
				options: operationFields.user.invite,
			},
			{
				displayName: 'User List Options',
				name: 'userListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['user'],
						operation: ['list'],
					},
				},
				options: operationFields.user.list,
			},
			
			// Token fields
			{
				displayName: 'Token Details',
				name: 'tokenDetails',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['create'],
					},
				},
				options: operationFields.token.create,
			},
			{
				displayName: 'Token Parameters',
				name: 'tokenParams',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['get'],
					},
				},
				options: operationFields.token.get,
			},
			{
				displayName: 'Token Parameters',
				name: 'tokenDeleteParams',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['delete'],
					},
				},
				options: operationFields.token.delete,
			},
			{
				displayName: 'Token List Options',
				name: 'tokenListOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				required: false,
				displayOptions: {
					show: {
						resource: ['token'],
						operation: ['list'],
					},
				},
				options: operationFields.token.list,
			},
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
					
				case 'company':
					console.log('[Paywise.node] Company operations:', operation);
					// Import company operations dynamically
					const { createCompany, getCompany, listCompanies } = await import('./resources');
					
					switch (operation) {
						case 'create':
							result = await createCompany.call(this);
							break;
						case 'get':
							result = await getCompany.call(this);
							break;
						case 'list':
							result = await listCompanies.call(this);
							break;
						default:
							throw new Error(`Operation not implemented: ${operation}`);
					}
					break;
					
				case 'user':
					console.log('[Paywise.node] User operations:', operation);
					// Import user operations dynamically
					const { getUser, inviteUser, listUsers } = await import('./resources');
					
					switch (operation) {
						case 'get':
							result = await getUser.call(this);
							break;
						case 'invite':
							result = await inviteUser.call(this);
							break;
						case 'list':
							result = await listUsers.call(this);
							break;
						default:
							throw new Error(`Operation not implemented: ${operation}`);
					}
					break;
					
				case 'token':
					console.log('[Paywise.node] Token operations:', operation);
					// Import token operations dynamically
					const { createToken, getToken, deleteToken, listTokens } = await import('./resources');
					
					switch (operation) {
						case 'create':
							result = await createToken.call(this);
							break;
						case 'get':
							result = await getToken.call(this);
							break;
						case 'delete':
							result = await deleteToken.call(this);
							break;
						case 'list':
							result = await listTokens.call(this);
							break;
						case 'getInfo':
							// Special case for token info - doesn't require parameters
							const getTokenInfo = async function(this: IExecuteFunctions): Promise<JsonObject> {
								console.log('[getTokenInfo] operation function called');
								
								try {
									// Get API URL for token info endpoint
									const url = await getApiUrl.call(this, ApiType.PARTNER, 'info');
									
									// Make API request
									const options = {
										method: 'GET',
										url,
										headers: {
											'Accept': 'application/json',
										},
									};
									
									console.log('[getTokenInfo] Making authenticated API request to:', url);
									const response = await this.helpers.requestWithAuthentication.call(
										this,
										'paywiseApi',
										options,
									);
									
									console.log('[getTokenInfo] Response received successfully');
									return JSON.parse(response);
								} catch (error) {
									console.error('[getTokenInfo] Error:', error);
									throw error;
								}
							};
							
							result = await getTokenInfo.call(this);
							break;
						default:
							throw new Error(`Operation not implemented: ${operation}`);
					}
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
				// Extract API error details if available
				const statusCode = paywiseError.response.statusCode || 'unknown';
				const errorMessage = paywiseError.response.body?.message || paywiseError.message;
				const errorDetails = paywiseError.response.body?.errors 
					? JSON.stringify(paywiseError.response.body.errors) 
					: '';
				
				console.error(`[Paywise.node] API Error (${statusCode}): ${errorMessage} ${errorDetails}`);
				throw new NodeApiError(this.getNode(), paywiseError as unknown as JsonObject);
			}
			
			// For non-API errors
			console.error('[Paywise.node] Execution error:', paywiseError.message);
			throw new NodeOperationError(
				this.getNode(), 
				`Failed to ${operation}: ${paywiseError.message}`
			);
		}

		return [returnData];
	}
} 