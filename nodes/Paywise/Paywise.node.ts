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
					{
						name: 'Add Bank Account',
						value: 'addBankAccount',
						description: 'Add bank account information to a debtor',
						action: 'Add bank account information to a debtor',
					},
					{
						name: 'Add Address',
						value: 'addAddress',
						description: 'Add address information to a debtor',
						action: 'Add address information to a debtor',
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
			// Input Type for Create and Update Operations
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Fields',
						value: 'fields',
						description: 'Input individual fields',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Input JSON object',
					},
				],
				default: 'fields',
				displayOptions: {
					show: {
						operation: ['createDebtor', 'createClaim'],
					},
				},
				description: 'Whether to input data via fields or JSON object',
			},
			// JSON Input for Create/Update Debtor
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'json',
				default: '{\n  "companyName": "",\n  "firstName": "",\n  "lastName": "",\n  "email": "",\n  "phone": "",\n  "address": {\n    "street": "",\n    "houseNumber": "",\n    "postalCode": "",\n    "city": "",\n    "country": ""\n  }\n}',
				required: true,
				displayOptions: {
					show: {
						operation: ['createDebtor'],
						inputType: ['json'],
					},
				},
				description: 'Debtor data as JSON object',
			},
			// JSON Input for Create/Update Claim
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'json',
				default: '{\n  "debtorId": "",\n  "reference": "",\n  "amount": 0,\n  "dueDate": "",\n  "description": ""\n}',
				required: true,
				displayOptions: {
					show: {
						operation: ['createClaim'],
						inputType: ['json'],
					},
				},
				description: 'Claim data as JSON object',
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
					},
				},
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
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
						inputType: ['fields'],
					},
				},
				description: 'Description of the claim',
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
				description: 'Name of the binary property containing the file data to upload. Allowed formats: PDF, JPEG, PNG',
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
			// Fields for Add Bank Account
			{
				displayName: 'Debtor ID',
				name: 'debtorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addBankAccount'],
						resource: ['debtor'],
					},
				},
				description: 'ID of the debtor to add bank account for',
			},
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Fields',
						value: 'fields',
						description: 'Input individual fields',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Input JSON object',
					},
				],
				default: 'fields',
				displayOptions: {
					show: {
						operation: ['addBankAccount'],
					},
				},
				description: 'Whether to input data via fields or JSON object',
			},
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'json',
				default: '{\n  "iban": "",\n  "bic": ""\n}',
				required: true,
				displayOptions: {
					show: {
						operation: ['addBankAccount'],
						inputType: ['json'],
					},
				},
				description: 'Bank account data as JSON object',
			},
			{
				displayName: 'IBAN',
				name: 'iban',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addBankAccount'],
						inputType: ['fields'],
					},
				},
				description: 'International Bank Account Number',
			},
			{
				displayName: 'BIC',
				name: 'bic',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addBankAccount'],
						inputType: ['fields'],
					},
				},
				description: 'Bank Identifier Code',
			},
			// Fields for Add Address
			{
				displayName: 'Debtor ID',
				name: 'debtorId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						resource: ['debtor'],
					},
				},
				description: 'ID of the debtor to add address for',
			},
			{
				displayName: 'Input Type',
				name: 'inputType',
				type: 'options',
				options: [
					{
						name: 'Fields',
						value: 'fields',
						description: 'Input individual fields',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Input JSON object',
					},
				],
				default: 'fields',
				displayOptions: {
					show: {
						operation: ['addAddress'],
					},
				},
				description: 'Whether to input data via fields or JSON object',
			},
			{
				displayName: 'JSON Data',
				name: 'jsonData',
				type: 'json',
				default: '{\n  "street": "",\n  "zip": "",\n  "city": "",\n  "country": "DE"\n}',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						inputType: ['json'],
					},
				},
				description: 'Address data as JSON object',
			},
			{
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						inputType: ['fields'],
					},
				},
				description: 'Street name',
			},
			{
				displayName: 'ZIP',
				name: 'zip',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						inputType: ['fields'],
					},
				},
				description: 'ZIP/Postal code',
			},
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						inputType: ['fields'],
					},
				},
				description: 'City name',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: 'DE',
				required: true,
				displayOptions: {
					show: {
						operation: ['addAddress'],
						inputType: ['fields'],
					},
				},
				description: 'Country code (e.g., AF for Afghanistan)',
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
				const inputType = this.getNodeParameter('inputType', 0) as string;
				let debtorData;

				if (inputType === 'json') {
					// Get data from JSON input
					debtorData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
				} else {
					// Get data from individual fields
					debtorData = {
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
				}

				// Make API call to create debtor
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/debtors/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(debtorData),
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
				const inputType = this.getNodeParameter('inputType', 0) as string;
				let claimData;

				if (inputType === 'json') {
					// Get data from JSON input
					claimData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
				} else {
					// Get data from individual fields
					claimData = {
						debtorId: this.getNodeParameter('debtorId', 0) as string,
						reference: this.getNodeParameter('reference', 0) as string,
						amount: this.getNodeParameter('amount', 0) as number,
						dueDate: this.getNodeParameter('dueDate', 0) as string,
						description: this.getNodeParameter('description', 0) as string,
					};
				}

				// Make API call to create claim
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(claimData),
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
					url: `${credentials.baseUrl}/claims/`,
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
					url: `${credentials.baseUrl}/debtors/`,
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

				// Validate file format
				const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
				if (!allowedMimeTypes.includes(binaryData.mimeType)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid file format. Allowed formats are PDF, JPEG, and PNG. Received: ${binaryData.mimeType}`,
					);
				}

				const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);

				const formData = {
					file: {
						value: binaryDataBuffer,
						options: {
							filename: binaryData.fileName,
							contentType: binaryData.mimeType,
						},
					},
				};

				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/claims/${claimId}/documents/`,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'multipart/form-data',
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

			if (operation === 'addBankAccount') {
				const debtorId = this.getNodeParameter('debtorId', 0) as string;
				const inputType = this.getNodeParameter('inputType', 0) as string;
				let bankAccountData;

				if (inputType === 'json') {
					// Get data from JSON input
					bankAccountData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
				} else {
					// Get data from individual fields
					bankAccountData = {
						iban: this.getNodeParameter('iban', 0) as string,
						bic: this.getNodeParameter('bic', 0) as string,
					};
				}

				// Make API call to add bank account
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/debtors/${debtorId}/bankaccounts/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(bankAccountData),
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

			if (operation === 'addAddress') {
				const debtorId = this.getNodeParameter('debtorId', 0) as string;
				const inputType = this.getNodeParameter('inputType', 0) as string;
				let addressData;

				if (inputType === 'json') {
					// Get data from JSON input
					addressData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
				} else {
					// Get data from individual fields
					addressData = {
						street: this.getNodeParameter('street', 0) as string,
						zip: this.getNodeParameter('zip', 0) as string,
						city: this.getNodeParameter('city', 0) as string,
						country: this.getNodeParameter('country', 0) as string,
					};
				}

				// Make API call to add address
				const options = {
					method: 'POST',
					url: `${credentials.baseUrl}/debtors/${debtorId}/addresses/`,
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					body: JSON.stringify(addressData),
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