import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { PaywiseClient } from '../../../PaywiseClient';
import { IClaimData, IClaimItem, IAdditionalCharge, IPayment } from '../claim.interfaces';

// Define operation field properties
export const createClaimFields: INodeProperties[] = [
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
];

/**
 * Maps node parameters to the IClaimData interface
 */
export function mapToClaimData(this: IExecuteFunctions): IClaimData {
	const inputType = this.getNodeParameter('inputType', 0) as string;
	
	if (inputType === 'json') {
		return JSON.parse(this.getNodeParameter('jsonData', 0) as string) as IClaimData;
	}
	
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
		unit: item.unit || undefined,
		amount: {
			value: item.amount_value,
			currency: item.amount_currency,
		},
	}));

	// Get additional charges
	const additionalChargesAmountValue = this.getNodeParameter('additional_charges_amount_value', 0, '') as string;
	const additionalChargesAmountCurrency = this.getNodeParameter('additional_charges_amount_currency', 0, 'EUR') as string;

	// Get additional charges collection
	const additionalChargesCollection = this.getNodeParameter('additional_charges', 0, { additionalChargesValues: [] }) as {
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
	const paymentsCollection = this.getNodeParameter('payments', 0, { paymentsValues: [] }) as {
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
	const claimData: IClaimData = {
		debtorId,
		reference,
		amount,
		dueDate,
		description,
	};

	// Only add optional fields if they exist
	if (items.length > 0) {
		claimData.items = items;
	}

	if (additionalChargesAmountValue) {
		claimData.additional_charges_amount = {
			value: additionalChargesAmountValue,
			currency: additionalChargesAmountCurrency,
		};
	}

	if (additionalCharges.length > 0) {
		claimData.additional_charges = additionalCharges;
	}

	if (payments.length > 0) {
		claimData.payments = payments;
	}

	return claimData;
}

export async function createClaim(this: IExecuteFunctions): Promise<JsonObject> {
	// Map node parameters to claim data
	const claimData = mapToClaimData.call(this);

	// Use PaywiseClient to create the claim
	const credentials = await this.getCredentials('paywiseApi');
	const client = new PaywiseClient(credentials, this);
	return client.createClaim(claimData);
} 