import { IExecuteFunctions } from 'n8n-core';
import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import { IResourceFunctions, IResourceDescription } from '../interfaces';

export const claimDescription: IResourceDescription = {
	operations: [
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
	],
	properties: [
		{
			displayName: 'Claim ID',
			name: 'claimId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['getClaim', 'cancelClaim', 'releaseClaim','uploadDocument'],
					resource: ['claim'],
				},
			},
			description: 'ID of the claim',
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
					operation: ['createClaim'],
				},
			},
			description: 'Whether to input data via fields or JSON object',
		},
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
	],
};

export const claimOperations: IResourceFunctions = {
	async createClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let claimData;

		if (inputType === 'json') {
			claimData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
			claimData = {
				debtorId: this.getNodeParameter('debtorId', 0) as string,
				reference: this.getNodeParameter('reference', 0) as string,
				amount: this.getNodeParameter('amount', 0) as number,
				dueDate: this.getNodeParameter('dueDate', 0) as string,
				description: this.getNodeParameter('description', 0) as string,
			};
		}

		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async getClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const claimId = this.getNodeParameter('claimId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async listClaims(this: IExecuteFunctions): Promise<JsonObject> {
		const limit = this.getNodeParameter('limit', 0, 10) as number;
		const offset = this.getNodeParameter('offset', 0, 0) as number;
		const credentials = await this.getCredentials('paywiseApi');

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
		
		return JSON.parse(response);
	},

	async releaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const claimId = this.getNodeParameter('claimId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async uploadDocument(this: IExecuteFunctions): Promise<JsonObject> {
		const claimId = this.getNodeParameter('claimId', 0) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');

		if (!claimId) {
			throw new NodeOperationError(this.getNode(), 'Claim ID is required but not provided.');
		}

		const items = this.getInputData();
		const item = items[0];

		if (!item.binary || !item.binary[binaryPropertyName]) {
			throw new NodeOperationError(
				this.getNode(),
				`No binary data property "${binaryPropertyName}" exists on item!`,
			);
		}

		const binaryData = item.binary[binaryPropertyName];
		const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

		if (!allowedMimeTypes.includes(binaryData.mimeType)) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid file format. Allowed formats are PDF, JPEG, and PNG. Received: ${binaryData.mimeType}`,
			);
		}

		const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);

		const formData = {
			claimId,
			file: {
				value: binaryDataBuffer,
				options: {
					filename: binaryData.fileName || 'document',
					contentType: binaryData.mimeType,
				},
			},
		};

		const options = {
			method: 'POST',
			url: `${credentials.baseUrl}/claims/${claimId}/documents/`,
			headers: {
				'Accept': 'application/json',
			},
			formData,
		};

		try {
			const response = await this.helpers.requestWithAuthentication.call(
				this,
				'paywiseApi',
				options,
			);
			console.log(response);
			return JSON.parse(response);
		} catch (error: any) {
			if (error.message) {
				throw new NodeOperationError(this.getNode(), `Error uploading document: ${error.message}`);
			}
			throw new NodeOperationError(this.getNode(), 'Error uploading document');
		}
	},
}; 