import { IExecuteFunctions } from 'n8n-core';
import { NodeOperationError, JsonObject, INodeProperties } from 'n8n-workflow';
import { IResourceFunctions, IResourceDescription } from '../interfaces';
import { PaywiseClient } from '../PaywiseClient';
import FormData = require('form-data');

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
					name: 'Create and Release',
					value: 'createAndReleaseClaim',
					description: 'Create a new claim and release it',
					action: 'Create and release a new claim',
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
			displayName: 'Input Type',
			name: 'inputType',
			type: 'options',
			options: [
				{
					name: 'JSON',
					value: 'json',
					description: 'Input JSON object',
				},
				{
					name: 'Fields',
					value: 'fields',
					description: 'Input individual fields',
				},
			],
			default: 'fields',
			displayOptions: {
				show: {
					operation: ['createClaim', 'createAndReleaseClaim'],
				},
			},
			description: 'Whether to input data via fields or JSON object',
		},
		{
			displayName: 'JSON Data',
			name: 'jsonData',
			type: 'json',
			default: '{\n  "debtorId": "c33d083e-ed26-4996-877d-b9dc23416268",\n  "reference": "INV-2024-001",\n  "amount": 1000,\n  "dueDate": "2024-02-15",\n  "description": "Software Development Services",\n  "items": [\n    {\n      "description": "Software Development",\n      "quantity": 40,\n      "unit": "hours",\n      "amount": {\n        "value": "800.00",\n        "currency": "EUR"\n      }\n    }\n  ],\n  "additional_charges_amount": {\n    "value": "200.00",\n    "currency": "EUR"\n  },\n  "additional_charges": [\n    {\n      "type": "reminder_fee",\n      "reference": "REM-001",\n      "description": "Late Payment Reminder Fee",\n      "amount": {\n        "value": "200.00",\n        "currency": "EUR"\n      }\n    }\n  ],\n  "payments": [\n    {\n      "reference": "PAY-001",\n      "amount": {\n        "value": "100.00",\n        "currency": "EUR"\n      },\n      "date": "2024-01-30"\n    }\n  ]\n}',
			required: true,
			displayOptions: {
				show: {
					operation: ['createClaim', 'createAndReleaseClaim'],
					inputType: ['json'],
				},
			},
			description: 'Claim data as JSON object',
		},
		// Basic Create Claim Fields
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
			description: 'ID of the debtor',
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
			description: 'Total amount of the claim',
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
		// Create Claim Items
		{
			displayName: 'Items',
			name: 'items',
			placeholder: 'Add Item',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'itemsValues',
					displayName: 'Item',
					values: [
						{
							displayName: 'Description',
							name: 'description',
							type: 'string',
							default: '',
							description: 'Description of the item',
						},
						{
							displayName: 'Quantity',
							name: 'quantity',
							type: 'number',
							default: 1,
							description: 'Quantity of the item',
						},
						{
							displayName: 'Unit',
							name: 'unit',
							type: 'string',
							default: '',
							description: 'Unit of the item',
						},
						{
							displayName: 'Amount Value',
							name: 'amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the item',
						},
						{
							displayName: 'Amount Currency',
							name: 'amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the item amount',
						},
					],
				},
			],
		},
		// Create Claim Additional Charges
		{
			displayName: 'Additional Charges Sum Amount',
			name: 'additional_charges_amount_value',
			type: 'string',
			default: '',
			required: false,
			displayOptions: {
				show: {
					operation: ['createClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Sum of all additional charges',
		},
		{
			displayName: 'Additional Charges Sum Currency',
			name: 'additional_charges_amount_currency',
			type: 'options',
			options: [
				{
					name: 'EUR',
					value: 'EUR',
				},
				{
					name: 'USD',
					value: 'USD',
				},
			],
			default: 'EUR',
			required: false,
			displayOptions: {
				show: {
					operation: ['createClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Currency of the additional charges sum',
		},
		{
			displayName: 'Additional Charges',
			name: 'additional_charges',
			placeholder: 'Add Additional Charge',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'additionalChargesValues',
					displayName: 'Additional Charge',
					values: [
						{
							displayName: 'Type',
							name: 'type',
							type: 'options',
							options: [
								{
									name: 'Reminder Fee',
									value: 'reminder_fee',
								},
								{
									name: 'Bank Charge',
									value: 'bank_charge',
								},
								{
									name: 'Processing Fee',
									value: 'processing_fee',
								},
								{
									name: 'Cancellation Fee',
									value: 'cancellation_fee',
								},
							],
							default: 'reminder_fee',
							description: 'Type of the additional charge',
						},
						{
							displayName: 'Reference',
							name: 'reference',
							type: 'string',
							default: '',
							description: 'Reference for this charge',
						},
						{
							displayName: 'Description',
							name: 'description',
							type: 'string',
							default: '',
							description: 'Description of the charge',
						},
						{
							displayName: 'Amount Value',
							name: 'amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the charge',
						},
						{
							displayName: 'Amount Currency',
							name: 'amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the charge amount',
						},
					],
				},
			],
		},
		// Create Claim Payments
		{
			displayName: 'Payments',
			name: 'payments',
			placeholder: 'Add Payment',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'paymentsValues',
					displayName: 'Payment',
					values: [
						{
							displayName: 'Reference',
							name: 'reference',
							type: 'string',
							default: '',
							description: 'Reference for this payment',
						},
						{
							displayName: 'Amount Value',
							name: 'amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the payment',
						},
						{
							displayName: 'Amount Currency',
							name: 'amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the payment amount',
						},
						{
							displayName: 'Date',
							name: 'date',
							type: 'dateTime',
							default: '',
							description: 'Date of the payment',
						},
					],
				},
			],
		},
		// Basic Claim Information
		{
			displayName: 'Debtor ID',
			name: 'debtor',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'ID of the debtor',
		},
		{
			displayName: 'Your Reference',
			name: 'your_reference',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Your reference for this claim',
		},
		{
			displayName: 'Subject Matter',
			name: 'subject_matter',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Subject matter of the claim',
		},
		// Dates
		{
			displayName: 'Occurrence Date',
			name: 'occurence_date',
			type: 'dateTime',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Date when the claim occurred',
		},
		{
			displayName: 'Document Reference',
			name: 'document_reference',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Reference of the document',
		},
		{
			displayName: 'Document Date',
			name: 'document_date',
			type: 'dateTime',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Date of the document',
		},
		{
			displayName: 'Due Date',
			name: 'due_date',
			type: 'dateTime',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Due date of the claim',
		},
		{
			displayName: 'Reminder Date',
			name: 'reminder_date',
			type: 'dateTime',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Date of the reminder',
		},
		{
			displayName: 'Delay Date',
			name: 'delay_date',
			type: 'dateTime',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Date of the delay',
		},
		// Amounts
		{
			displayName: 'Total Claim Amount',
			name: 'total_claim_amount_value',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Total amount of the claim',
		},
		{
			displayName: 'Total Claim Currency',
			name: 'total_claim_amount_currency',
			type: 'options',
			options: [
				{
					name: 'EUR',
					value: 'EUR',
				},
				{
					name: 'USD',
					value: 'USD',
				},
			],
			default: 'EUR',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Currency of the total claim amount',
		},
		{
			displayName: 'Main Claim Amount',
			name: 'main_claim_amount_value',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Main amount of the claim',
		},
		{
			displayName: 'Main Claim Currency',
			name: 'main_claim_amount_currency',
			type: 'options',
			options: [
				{
					name: 'EUR',
					value: 'EUR',
				},
				{
					name: 'USD',
					value: 'USD',
				},
			],
			default: 'EUR',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Currency of the main claim amount',
		},
		// Items
		{
			displayName: 'Items',
			name: 'items',
			placeholder: 'Add Item',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'itemsValues',
					displayName: 'Item',
					values: [
						{
							displayName: 'Description',
							name: 'items_description',
							type: 'string',
							default: '',
							description: 'Description of the item',
						},
						{
							displayName: 'Quantity',
							name: 'items_quantity',
							type: 'number',
							default: 1,
							description: 'Quantity of the item',
						},
						{
							displayName: 'Unit',
							name: 'items_unit',
							type: 'string',
							default: '',
							description: 'Unit of the item',
						},
						{
							displayName: 'Amount Value',
							name: 'items_amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the item',
						},
						{
							displayName: 'Amount Currency',
							name: 'items_amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the item amount',
						},
					],
				},
			],
		},
		// Additional Charges
		{
			displayName: 'Additional Charges Sum Amount',
			name: 'additional_charges_sum_amount_value',
			type: 'string',
			default: '',
			required: false,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Sum of all additional charges',
		},
		{
			displayName: 'Additional Charges Sum Currency',
			name: 'additional_charges_sum_amount_currency',
			type: 'options',
			options: [
				{
					name: 'EUR',
					value: 'EUR',
				},
				{
					name: 'USD',
					value: 'USD',
				},
			],
			default: 'EUR',
			required: false,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Currency of the additional charges sum',
		},
		{
			displayName: 'Additional Charges',
			name: 'additional_charges',
			placeholder: 'Add Additional Charge',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'additionalChargesValues',
					displayName: 'Additional Charge',
					values: [
						{
							displayName: 'Type',
							name: 'additional_charges_type',
							type: 'options',
							options: [
								{
									name: 'Reminder Fee',
									value: 'reminder_fee',
								},
								{
									name: 'Bank Charge',
									value: 'bank_charge',
								},
								{
									name: 'Processing Fee',
									value: 'processing_fee',
								},
								{
									name: 'Cancellation Fee',
									value: 'cancellation_fee',
								},
								{
									name: 'Convenience Fee',
									value: 'convenience_fee',
								},
								{
									name: 'Advisory Fee',
									value: 'advisory_fee',
								},
								{
									name: 'Handling Fee',
									value: 'handling_fee',
								},
								{
									name: 'Insurance Fee',
									value: 'insurance_fee',
								},
								{
									name: 'Legal Fee',
									value: 'legal_fee',
								},
								{
									name: 'Delivery Charge',
									value: 'delivery_charge',
								},
								{
									name: 'Service Charge',
									value: 'service_charge',
								},
								{
									name: 'Data Preparation',
									value: 'data_preparation',
								},
								{
									name: 'Communication Cost',
									value: 'communication_cost',
								},
								{
									name: 'Expenses',
									value: 'expenses',
								},
							],
							default: 'reminder_fee',
							description: 'Type of the additional charge',
						},
						{
							displayName: 'Your Reference',
							name: 'additional_charges_your_reference',
							type: 'string',
							default: '',
							description: 'Your reference for this charge',
						},
						{
							displayName: 'Subject Matter',
							name: 'additional_charges_subject_matter',
							type: 'string',
							default: '',
							description: 'Subject matter of the charge',
						},
						{
							displayName: 'Occurrence Date',
							name: 'additional_charges_occurence_date',
							type: 'dateTime',
							default: '',
							description: 'Date when the charge occurred',
						},
						{
							displayName: 'Document Date',
							name: 'additional_charges_document_date',
							type: 'dateTime',
							default: '',
							description: 'Date of the charge document',
						},
						{
							displayName: 'Due Date',
							name: 'additional_charges_due_date',
							type: 'dateTime',
							default: '',
							description: 'Due date of the charge',
						},
						{
							displayName: 'Amount Value',
							name: 'additional_charges_amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the charge',
						},
						{
							displayName: 'Amount Currency',
							name: 'additional_charges_amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the charge amount',
						},
					],
				},
			],
		},
		// Payments
		{
			displayName: 'Payments',
			name: 'payments',
			placeholder: 'Add Payment',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'paymentsValues',
					displayName: 'Payment',
					values: [
						{
							displayName: 'Your Reference',
							name: 'payments_your_reference',
							type: 'string',
							default: '',
							description: 'Your reference for this payment',
						},
						{
							displayName: 'Amount Value',
							name: 'payments_amount_value',
							type: 'string',
							default: '',
							description: 'Amount value of the payment',
						},
						{
							displayName: 'Amount Currency',
							name: 'payments_amount_currency',
							type: 'options',
							options: [
								{
									name: 'EUR',
									value: 'EUR',
								},
								{
									name: 'USD',
									value: 'USD',
								},
							],
							default: 'EUR',
							description: 'Currency of the payment amount',
						},
						{
							displayName: 'Value Date',
							name: 'payments_value_date',
							type: 'dateTime',
							default: '',
							description: 'Value date of the payment',
						},
					],
				},
			],
		},
		// Documents
		{
			displayName: 'Documents',
			name: 'documents',
			placeholder: 'Add Document',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			default: {},
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			options: [
				{
					name: 'documentsValues',
					displayName: 'Document',
					values: [
						{
							displayName: 'Binary Property',
							name: 'binary_property',
							type: 'string',
							default: 'data',
							description: 'Name of the binary property containing the file data',
						},
						{
							displayName: 'File Name',
							name: 'file_name',
							type: 'string',
							default: '',
							description: 'Name of the file',
						},
					],
				},
			],
		},
		// Other Fields
		{
			displayName: 'Starting Approach',
			name: 'starting_approach',
			type: 'options',
			options: [
				{
					name: 'Extrajudicial',
					value: 'extrajudicial',
				},
				{
					name: 'Judicial',
					value: 'judicial',
				},
			],
			default: 'extrajudicial',
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Starting approach for the claim',
		},
		{
			displayName: 'Claim Disputed',
			name: 'claim_disputed',
			type: 'boolean',
			default: false,
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Whether the claim is disputed',
		},
		{
			displayName: 'Obligation Fulfilled',
			name: 'obligation_fulfilled',
			type: 'boolean',
			default: true,
			required: true,
			displayOptions: {
				show: {
					operation: ['createAndReleaseClaim'],
					inputType: ['fields'],
				},
			},
			description: 'Whether the obligation is fulfilled',
		},
		// Get Claim Properties
		{
			displayName: 'Claim ID',
			name: 'claimId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					operation: ['getClaim', 'releaseClaim', 'uploadDocument'],
					resource: ['claim'],
				},
			},
			description: 'ID of the claim',
		},
		// List Claims Properties
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
		// Upload Document Properties
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
			description: 'Name of the binary property containing the file data',
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
			// Get basic claim information
			const debtorId = this.getNodeParameter('debtorId', 0) as string;
			const reference = this.getNodeParameter('reference', 0) as string;
			const amount = this.getNodeParameter('amount', 0) as number;
			const dueDate = (this.getNodeParameter('dueDate', 0) as string).split('T')[0];
			const description = this.getNodeParameter('description', 0) as string;

			// Get items
			const itemsCollection = this.getNodeParameter('items', 0) as {
				itemsValues: Array<{
					description: string;
					quantity: number;
					unit: string;
					amount_value: string;
					amount_currency: string;
				}>;
			};

			const items = (itemsCollection.itemsValues || []).map((item) => ({
				description: item.description,
				quantity: item.quantity,
				unit: item.unit || null,
				amount: {
					value: item.amount_value,
					currency: item.amount_currency,
				},
			}));

			// Get additional charges
			const additionalChargesAmount = {
				value: this.getNodeParameter('additional_charges_amount_value', 0) as string,
				currency: this.getNodeParameter('additional_charges_amount_currency', 0) as string,
			};

			const additionalChargesCollection = this.getNodeParameter('additional_charges', 0) as {
				additionalChargesValues: Array<{
					type: string;
					reference: string;
					description: string;
					amount_value: string;
					amount_currency: string;
				}>;
			};

			const additionalCharges = (additionalChargesCollection.additionalChargesValues || []).map((charge) => ({
				type: charge.type,
				reference: charge.reference,
				description: charge.description,
				amount: {
					value: charge.amount_value,
					currency: charge.amount_currency,
				},
			}));

			// Get payments
			const paymentsCollection = this.getNodeParameter('payments', 0) as {
				paymentsValues: Array<{
					reference: string;
					amount_value: string;
					amount_currency: string;
					date: string;
				}>;
			};

			const payments = (paymentsCollection.paymentsValues || []).map((payment) => ({
				reference: payment.reference,
				amount: {
					value: payment.amount_value,
					currency: payment.amount_currency,
				},
				date: payment.date.split('T')[0],
			}));

			// Combine all data
			claimData = {
				debtorId,
				reference,
				amount,
				dueDate,
				description,
				items,
				additional_charges_amount: additionalChargesAmount,
				additional_charges: additionalCharges,
				payments,
			};
		}

		const credentials = await this.getCredentials('paywiseApi');
		const client = new PaywiseClient(credentials, this);
		const claim = await client.createClaim(claimData);

		if (!claim.id || typeof claim.id !== 'string') {
			throw new NodeOperationError(this.getNode(), 'Failed to get valid claim ID from create response');
		}

		// Upload documents if any
		if (inputType === 'fields') {
			const documentsCollection = this.getNodeParameter('documents', 0) as {
				documentsValues: Array<{
					binary_property: string;
					file_name: string;
				}>;
			};

			if (documentsCollection.documentsValues) {
				for (const doc of documentsCollection.documentsValues) {
					const binaryProperty = doc.binary_property;
					const fileName = doc.file_name;

					const items = this.getInputData();
					const item = items[0];

					if (!item.binary || !item.binary[binaryProperty]) {
						throw new NodeOperationError(
							this.getNode(),
							`No binary data property "${binaryProperty}" exists on item!`,
						);
					}

					const binaryData = item.binary[binaryProperty];
					const contentType = client.getContentType(fileName);
					const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryProperty);

					await client.uploadClaimDocument(claim.id as string, binaryDataBuffer, fileName, contentType);
				}
			}
		}

		// Release the claim
		return await client.releaseClaim(claim.id as string);
	},

	async releaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const claimId = this.getNodeParameter('claimId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
		const client = new PaywiseClient(credentials, this);
		return await client.releaseClaim(claimId);
	},

	async createAndReleaseClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const inputType = this.getNodeParameter('inputType', 0) as string;
		let claimData;

		if (inputType === 'json') {
			claimData = JSON.parse(this.getNodeParameter('jsonData', 0) as string);
		} else {
			// Get all the basic claim information
			const debtor = this.getNodeParameter('debtor', 0) as string;
			const yourReference = this.getNodeParameter('your_reference', 0) as string;
			const subjectMatter = this.getNodeParameter('subject_matter', 0) as string;
			const occurenceDate = (this.getNodeParameter('occurence_date', 0) as string).split('T')[0];
			const documentReference = this.getNodeParameter('document_reference', 0) as string;
			const documentDate = (this.getNodeParameter('document_date', 0) as string).split('T')[0];
			const dueDate = (this.getNodeParameter('due_date', 0) as string).split('T')[0];
			const reminderDate = (this.getNodeParameter('reminder_date', 0) as string).split('T')[0];
			const delayDate = (this.getNodeParameter('delay_date', 0) as string).split('T')[0];

			// Get amounts
			const totalClaimAmount = {
				value: this.getNodeParameter('total_claim_amount_value', 0) as string,
				currency: this.getNodeParameter('total_claim_amount_currency', 0) as string,
			};

			const mainClaimAmount = {
				value: this.getNodeParameter('main_claim_amount_value', 0) as string,
				currency: this.getNodeParameter('main_claim_amount_currency', 0) as string,
			};

			// Get items
			const itemsCollection = this.getNodeParameter('items', 0) as {
				itemsValues: Array<{
					items_description: string;
					items_quantity: number;
					items_unit: string;
					items_amount_value: string;
					items_amount_currency: string;
				}>;
			};

			const items = (itemsCollection.itemsValues || []).map((item) => ({
				description: item.items_description,
				quantity: item.items_quantity,
				unit: item.items_unit || null,
				amount: {
					value: item.items_amount_value,
					currency: item.items_amount_currency,
				},
			}));

			// Get additional charges
			const additionalChargesAmount = {
				value: this.getNodeParameter('additional_charges_sum_amount_value', 0) as string,
				currency: this.getNodeParameter('additional_charges_sum_amount_currency', 0) as string,
			};

			const additionalChargesCollection = this.getNodeParameter('additional_charges', 0) as {
				additionalChargesValues: Array<{
					additional_charges_type: string;
					additional_charges_your_reference: string;
					additional_charges_subject_matter: string;
					additional_charges_occurence_date: string;
					additional_charges_document_date: string;
					additional_charges_due_date: string;
					additional_charges_amount_value: string;
					additional_charges_amount_currency: string;
				}>;
			};

			const additionalCharges = (additionalChargesCollection.additionalChargesValues || []).map((charge) => ({
				type: charge.additional_charges_type,
				your_reference: charge.additional_charges_your_reference,
				subject_matter: charge.additional_charges_subject_matter,
				occurence_date: charge.additional_charges_occurence_date.split('T')[0],
				document_date: charge.additional_charges_document_date.split('T')[0],
				due_date: charge.additional_charges_due_date ? charge.additional_charges_due_date.split('T')[0] : undefined,
				amount: {
					value: charge.additional_charges_amount_value,
					currency: charge.additional_charges_amount_currency,
				},
			}));

			// Get payments
			const paymentsCollection = this.getNodeParameter('payments', 0) as {
				paymentsValues: Array<{
					payments_your_reference: string;
					payments_amount_value: string;
					payments_amount_currency: string;
					payments_value_date: string;
				}>;
			};

			const payments = (paymentsCollection.paymentsValues || []).map((payment) => ({
				your_reference: payment.payments_your_reference,
				amount: {
					value: payment.payments_amount_value,
					currency: payment.payments_amount_currency,
				},
				value_date: payment.payments_value_date.split('T')[0],
			}));

			// Get other fields
			const startingApproach = this.getNodeParameter('starting_approach', 0) as string;
			const claimDisputed = this.getNodeParameter('claim_disputed', 0) as boolean;
			const obligationFulfilled = this.getNodeParameter('obligation_fulfilled', 0) as boolean;

			// Combine all data
			claimData = {
				debtor,
				your_reference: yourReference,
				subject_matter: subjectMatter,
				occurence_date: occurenceDate,
				document_reference: documentReference,
				document_date: documentDate,
				due_date: dueDate,
				reminder_date: reminderDate,
				delay_date: delayDate,
				total_claim_amount: totalClaimAmount,
				main_claim_amount: mainClaimAmount,
				items,
				additional_charges_amount: additionalChargesAmount,
				additional_charges: additionalCharges,
				payments,
				starting_approach: startingApproach,
				claim_disputed: claimDisputed,
				obligation_fulfilled: obligationFulfilled,
			};
		}

		const credentials = await this.getCredentials('paywiseApi');
		const client = new PaywiseClient(credentials, this);

		// Create the claim
		const claim = await client.createClaim(claimData);

		if (!claim.id || typeof claim.id !== 'string') {
			throw new NodeOperationError(this.getNode(), 'Failed to get valid claim ID from create response');
		}

		// Upload documents if any
		if (inputType === 'fields') {
			const documentsCollection = this.getNodeParameter('documents', 0) as {
				documentsValues: Array<{
					binary_property: string;
					file_name: string;
				}>;
			};

			if (documentsCollection.documentsValues) {
				for (const doc of documentsCollection.documentsValues) {
					const binaryProperty = doc.binary_property;
					const fileName = doc.file_name;

					const items = this.getInputData();
					const item = items[0];

					if (!item.binary || !item.binary[binaryProperty]) {
						throw new NodeOperationError(
							this.getNode(),
							`No binary data property "${binaryProperty}" exists on item!`,
						);
					}

					const binaryData = item.binary[binaryProperty];
					const contentType = client.getContentType(fileName);
					const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(0, binaryProperty);

					await client.uploadClaimDocument(claim.id as string, binaryDataBuffer, fileName, contentType);
				}
			}
		}

		// Release the claim
		return await client.releaseClaim(claim.id as string);
	},

	async getClaim(this: IExecuteFunctions): Promise<JsonObject> {
		const claimId = this.getNodeParameter('claimId', 0) as string;
		const credentials = await this.getCredentials('paywiseApi');
		const client = new PaywiseClient(credentials, this);
		return await client.getClaim(claimId);
	},

	async listClaims(this: IExecuteFunctions): Promise<JsonObject> {
		const limit = this.getNodeParameter('limit', 0, 10) as number;
		const offset = this.getNodeParameter('offset', 0, 0) as number;
		const credentials = await this.getCredentials('paywiseApi');
		const client = new PaywiseClient(credentials, this);
		return await client.listClaims(limit, offset);
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
		const client = new PaywiseClient(credentials, this);
		const fileName = binaryData.fileName || 'document';
		const contentType = binaryData.mimeType;

		return await client.uploadClaimDocument(claimId, binaryDataBuffer, fileName, contentType);
	},
}; 