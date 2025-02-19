import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
	JsonObject,
} from 'n8n-workflow';

interface PaywiseApiError {
	response?: {
		body: {
			message: string;
		};
	};
	message: string;
}

export class Paywise implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Paywise',
		name: 'paywise',
		icon: 'fa:money',
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
				],
				default: 'debtor',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['claim'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'createClaim',
						description: 'Create a new claim',
						action: 'Create a new claim',
					},
					{
						name: 'Get',
						value: 'getClaim',
						description: 'Retrieve a claim',
						action: 'Get a claim',
					},
					{
						name: 'List',
						value: 'listClaims',
						description: 'List all claims',
						action: 'List all claims',
					},
					{
						name: 'Release',
						value: 'releaseClaim',
						description: 'Release claim for processing',
						action: 'Release a claim',
					},
					{
						name: 'Upload Document',
						value: 'uploadDocument',
						description: 'Upload a document to a claim',
						action: 'Upload a document to a claim',
					},
				],
				default: 'listClaims',
			},
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['debtor'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'createDebtor',
						description: 'Create a new debtor',
						action: 'Create a new debtor',
					},
					{
						name: 'Get',
						value: 'getDebtor',
						description: 'Retrieve a debtor',
						action: 'Get a debtor',
					},
					{
						name: 'List',
						value: 'listDebtors',
						description: 'List all debtors',
						action: 'List all debtors',
					},
				],
				default: 'listDebtors',
			},
			// ID Fields for Get Operations
			{
				displayName: 'Claim ID',
				name: 'claimId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getClaim', 'cancelClaim', 'releaseClaim'],
						resource: ['claim'],
					},
				},
				description: 'ID of the claim',
			},
			{
				displayName: 'Debtor ID',
				name: 'debtorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getDebtor'],
						resource: ['debtor'],
					},
				},
				description: 'ID of the debtor to retrieve',
			},
			// Create Claim Fields
			{
				displayName: 'Debtor ID',
				name: 'debtorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						resource: ['claim'],
					},
				},
				description: 'ID of the debtor for this claim',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						resource: ['claim'],
					},
				},
				description: 'Your reference for this claim',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						resource: ['claim'],
					},
				},
				description: 'Amount of the claim in cents',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						resource: ['claim'],
					},
				},
				description: 'Due date of the claim',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						resource: ['claim'],
					},
				},
				description: 'Description of the claim',
			},
			// Create Debtor Fields
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
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
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'House Number',
				name: 'houseNumber',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'DE',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						resource: ['debtor'],
					},
				},
			},
			// Fields for Update Claim
			{
				displayName: 'Claim ID',
				name: 'claimId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['getClaim', 'cancelClaim'],
						resource: ['claim'],
					},
				},
				description: 'ID of the claim',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateClaim'],
						resource: ['claim'],
					},
				},
				description: 'Your reference for this claim',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 0,
				required: false,
				displayOptions: {
					show: {
						operation: ['updateClaim'],
						resource: ['claim'],
					},
				},
				description: 'Amount of the claim in cents',
			},
			{
				displayName: 'Due Date',
				name: 'dueDate',
				type: 'dateTime',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateClaim'],
						resource: ['claim'],
					},
				},
				description: 'Due date of the claim',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateClaim'],
						resource: ['claim'],
					},
				},
				description: 'Description of the claim',
			},
			// Fields for Update Debtor
			{
				displayName: 'Debtor ID',
				name: 'debtorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['updateDebtor', 'deleteDebtor'],
						resource: ['debtor'],
					},
				},
				description: 'ID of the debtor to update',
			},
			{
				displayName: 'Company Name',
				name: 'companyName',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'House Number',
				name: 'houseNumber',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Postal Code',
				name: 'postalCode',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'DE',
				required: false,
				displayOptions: {
					show: {
						operation: ['updateDebtor'],
						resource: ['debtor'],
					},
				},
			},
			// Fields for Document Upload
			{
				displayName: 'Claim ID',
				name: 'claimId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
						resource: ['claim'],
					},
				},
				description: 'ID of the claim to upload document to',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
						resource: ['claim'],
					},
				},
				description: 'Name of the binary property containing the file data to upload',
			},
			{
				displayName: 'Document Type',
				name: 'documentType',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['uploadDocument'],
						resource: ['claim'],
					},
				},
				description: 'Type of the document being uploaded',
			},
			// Pagination Parameters for List Claims
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				required: false,
				displayOptions: {
					show: {
						operation: ['listClaims'],
						resource: ['claim'],
					},
				},
				description: 'Number of claims to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				required: false,
				displayOptions: {
					show: {
						operation: ['listClaims'],
						resource: ['claim'],
					},
				},
				description: 'Number of claims to skip',
			},
			// Pagination Parameters for List Debtors
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 10,
				required: false,
				displayOptions: {
					show: {
						operation: ['listDebtors'],
						resource: ['debtor'],
					},
				},
				description: 'Number of debtors to return',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				default: 0,
				required: false,
				displayOptions: {
					show: {
						operation: ['listDebtors'],
						resource: ['debtor'],
					},
				},
				description: 'Number of debtors to skip',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('paywiseApi');
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		try {
			if (operation === 'createDebtor') {
				// Get all the debtor fields
				const debtor = {
					companyName: this.getNodeParameter('companyName', 0) as string,
					firstName: this.getNodeParameter('firstName', 0) as string,
					lastName: this.getNodeParameter('lastName', 0) as string,
					email: this.getNodeParameter('email', 0) as string,
					phone: this.getNodeParameter('phone', 0) as string,
					address: {
						street: this.getNodeParameter('street', 0) as string,
						houseNumber: this.getNodeParameter('houseNumber', 0) as string,
						postalCode: this.getNodeParameter('postalCode', 0) as string,
						city: this.getNodeParameter('city', 0) as string,
						country: this.getNodeParameter('country', 0) as string,
					},
				};

				// Make API call to create debtor
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/debtors`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(debtor),
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'createClaim') {
				// Get all the claim fields
				const claim = {
					debtorId: this.getNodeParameter('debtorId', 0) as string,
					reference: this.getNodeParameter('reference', 0) as string,
					amount: this.getNodeParameter('amount', 0) as number,
					dueDate: this.getNodeParameter('dueDate', 0) as string,
					description: this.getNodeParameter('description', 0) as string,
				};

				// Make API call to create claim
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(claim),
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'getClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const options = {
					method: 'GET',
					url: `${credentials.baseUrl}/claims/${claimId}`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'getDebtor') {
				const debtorId = this.getNodeParameter('debtorId', 0) as string;
				const options = {
					method: 'GET',
					url: `${credentials.baseUrl}/debtors/${debtorId}/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'listClaims') {
				const limit = this.getNodeParameter('limit', 0, 10) as number;
				const offset = this.getNodeParameter('offset', 0, 0) as number;

				const options = {
					method: 'GET',
					url: `${credentials.baseUrl}/claims`,
					headers: {
						'Accept': 'application/json',
					},
					qs: {
						limit,
						offset,
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'listDebtors') {
				const limit = this.getNodeParameter('limit', 0, 10) as number;
				const offset = this.getNodeParameter('offset', 0, 0) as number;

				const options = {
					method: 'GET',
					url: `${credentials.baseUrl}/debtors`,
					headers: {
						'Accept': 'application/json',
					},
					qs: {
						limit,
						offset,
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'getInfo') {
				const options = {
					method: 'GET',
					url: `${credentials.baseUrl}/info`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'updateDebtor') {
				const debtorId = this.getNodeParameter('debtorId', 0) as string;
				const updateFields = [
					'companyName', 'firstName', 'lastName', 'email', 'phone',
					'street', 'houseNumber', 'postalCode', 'city', 'country',
				];

				const updateData: any = {};
				const address: any = {};

				for (const field of updateFields) {
					const value = this.getNodeParameter(field, 0, null) as string;
					if (value !== null) {
						if (['street', 'houseNumber', 'postalCode', 'city', 'country'].includes(field)) {
							address[field] = value;
						} else {
							updateData[field] = value;
						}
					}
				}

				if (Object.keys(address).length > 0) {
					updateData.address = address;
				}

				const options = {
					method: 'PUT',
					url: `${credentials.baseUrl}/debtors/${debtorId}/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(updateData),
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'deleteDebtor') {
				const debtorId = this.getNodeParameter('debtorId', 0) as string;
				const options = {
					method: 'DELETE',
					url: `${credentials.baseUrl}/debtors/${debtorId}/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'updateClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const updateFields = ['reference', 'amount', 'dueDate', 'description'];
				const updateData: any = {};

				for (const field of updateFields) {
					const value = this.getNodeParameter(field, 0, null);
					if (value !== null) {
						updateData[field] = value;
					}
				}

				const options = {
					method: 'PUT',
					url: `${credentials.baseUrl}/claims/${claimId}/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(updateData),
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'deleteClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const options = {
					method: 'DELETE',
					url: `${credentials.baseUrl}/claims/${claimId}/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'cancelClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims/${claimId}/cancel/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'remindClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims/${claimId}/remind/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'releaseClaim') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const options = {
					method: 'PATCH',
					url: `${credentials.baseUrl}/claims/${claimId}/release/`,
					headers: {
						'Accept': 'application/json',
					},
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}

			if (operation === 'uploadDocument') {
				const claimId = this.getNodeParameter('claimId', 0) as string;
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
				const documentType = this.getNodeParameter('documentType', 0) as string;

				const item = items[0];

				if (!item.binary) {
					throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
				}

				const binaryData = item.binary[binaryPropertyName];

				if (item.binary === undefined || !item.binary[binaryPropertyName]) {
					throw new NodeOperationError(
						this.getNode(),
						`No binary data property "${binaryPropertyName}" exists on item!`,
					);
				}

				const formData = {
					file: {
						value: Buffer.from(binaryData.data, 'base64'),
						options: {
							filename: binaryData.fileName,
							contentType: binaryData.mimeType,
						},
					},
					type: documentType,
				};

				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims/${claimId}/documents/`,
					headers: {
						'Accept': 'application/json',
					},
					formData,
				};

				const response = await this.helpers.requestWithAuthentication.call(
					this,
					'paywiseApi',
					options,
				);
				
				returnData.push({
					json: JSON.parse(response),
				});
			}
		} catch (error) {
			const paywiseError = error as PaywiseApiError;
			if (paywiseError.response) {
				throw new NodeApiError(this.getNode(), paywiseError as unknown as JsonObject);
			}
			throw new NodeOperationError(this.getNode(), `Failed to ${operation}: ` + paywiseError.message);
		}

		return [returnData];
	}
} 