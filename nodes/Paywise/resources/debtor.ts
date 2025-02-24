import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { IResourceFunctions, IResourceDescription } from '../interfaces';

export const debtorDescription: IResourceDescription = {
	operations: [
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
	],
	properties: [
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
					operation: ['createDebtor'],
				},
			},
			description: 'Whether to input data via fields or JSON object',
		},
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
		// Bank Account Fields
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
		// Address Fields
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

export const debtorOperations: IResourceFunctions = {
	async createDebtor(this: IExecuteFunctions): Promise<JsonObject> {
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let debtorData;

		if (inputType === 'json') {
			debtorData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
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

		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async getDebtor(this: IExecuteFunctions): Promise<JsonObject> {
		const debtorId = this.getNodeParameter('debtorId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async listDebtors(this: IExecuteFunctions): Promise<JsonObject> {
		const limit = this.getNodeParameter('limit', 0, 10) as number;
		const offset = this.getNodeParameter('offset', 0, 0) as number;
		const credentials = await this.getCredentials('paywiseApi');

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
		
		return JSON.parse(response);
	},

	async addBankAccount(this: IExecuteFunctions): Promise<JsonObject> {
		const debtorId = this.getNodeParameter('debtorId', 0) as string;
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let bankAccountData;

		if (inputType === 'json') {
			bankAccountData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
			bankAccountData = {
				iban: this.getNodeParameter('iban', 0) as string,
				bic: this.getNodeParameter('bic', 0) as string,
			};
		}

		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},

	async addAddress(this: IExecuteFunctions): Promise<JsonObject> {
		const debtorId = this.getNodeParameter('debtorId', 0) as string;
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let addressData;

		if (inputType === 'json') {
			addressData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
			addressData = {
				street: this.getNodeParameter('street', 0) as string,
				zip: this.getNodeParameter('zip', 0) as string,
				city: this.getNodeParameter('city', 0) as string,
				country: this.getNodeParameter('country', 0) as string,
			};
		}

		const credentials = await this.getCredentials('paywiseApi');
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
		
		return JSON.parse(response);
	},
}; 