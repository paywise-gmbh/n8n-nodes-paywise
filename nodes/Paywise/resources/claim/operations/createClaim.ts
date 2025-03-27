import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, NodeOperationError, INodeProperties } from 'n8n-workflow';
import { IClaimData, IClaimItem, IAdditionalCharge, IPayment } from '../claim.interfaces';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
		displayOptions: {
			show: {
				resource: ['claim'],
			},
		},
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
				resource: ['claim'],
			},
		},
		description: 'Claim data as JSON object',
	},
	// Basic Create Claim Fields
	{
		displayName: 'Debtor ID',
		name: 'debtor',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
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
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Your reference for this claim',
	},
	{
		displayName: 'Main Claim Amount Value',
		name: 'main_claim_amount_value',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Value of the main claim amount',
	},
	{
		displayName: 'Main Claim Amount Currency',
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
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Currency of the main claim amount',
	},
	{
		displayName: 'Total Claim Amount Value',
		name: 'total_claim_amount_value',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Total value of the claim including additional charges',
	},
	{
		displayName: 'Total Claim Amount Currency',
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
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Currency of the total claim amount',
	},
	{
		displayName: 'Due Date',
		name: 'due_date',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'YYYY-MM-DD',
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Due date of the claim in YYYY-MM-DD format',
	},
	{
		displayName: 'Subject Matter',
		name: 'subject_matter',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Detailed description of the delivered goods or the provided service',
	},
	// Optional fields
	{
		displayName: 'Occurrence Date',
		name: 'occurence_date',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		required: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The date of emergence of the principal claim ("Vertragsdatum") in YYYY-MM-DD format',
	},
	{
		displayName: 'Document Reference',
		name: 'document_reference',
		type: 'string',
		default: '',
		required: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The unique reference of your invoice, contract or other document',
	},
	{
		displayName: 'Document Date',
		name: 'document_date',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		required: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The date of your invoice, contract or other document in YYYY-MM-DD format',
	},
	{
		displayName: 'Reminder Date',
		name: 'reminder_date',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		required: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The date of your first reminder ("Mahnung") to your customer in YYYY-MM-DD format',
	},
	{
		displayName: 'Delay Date',
		name: 'delay_date',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DD',
		required: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The date from which your debtor is in delay ("Verzugsdatum") in YYYY-MM-DD format',
	},
	{
		displayName: 'Starting Approach',
		name: 'starting_approach',
		type: 'options',
		options: [
			{
				name: 'Extrajudicial',
				value: 'extrajudicial',
				description: 'Start with extrajudicial collection',
			},
			{
				name: 'Judicial',
				value: 'judicial',
				description: 'Start with judicial proceedings',
			},
			{
				name: 'Mail',
				value: 'mail',
				description: 'Start with mail notification',
			},
		],
		default: 'extrajudicial',
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'The starting approach to collect the claim',
	},
	{
		displayName: 'Claim Disputed',
		name: 'claim_disputed',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Whether the claim was disputed by your customer',
	},
	{
		displayName: 'Obligation Fulfilled',
		name: 'obligation_fulfilled',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				inputType: ['fields'],
				resource: ['claim'],
			},
		},
		description: 'Whether you fully fulfilled your contractual obligation towards the debtor',
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
				resource: ['claim'],
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
				resource: ['claim'],
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
				resource: ['claim'],
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
				resource: ['claim'],
			},
		},
		options: [
			{
				name: 'additionalChargesValues',
				displayName: 'Additional Charge',
				values: [
					{
						displayName: 'Your Reference',
						name: 'your_reference',
						type: 'string',
						default: '',
						description: 'Your reference for this charge',
					},
					{
						displayName: 'Document Reference',
						name: 'document_reference',
						type: 'string',
						default: '',
						description: 'Document reference for this charge',
					},
					{
						displayName: 'Subject Matter',
						name: 'subject_matter',
						type: 'string',
						default: '',
						description: 'Description of the charge',
					},
					{
						displayName: 'Occurrence Date',
						name: 'occurence_date',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
						description: 'Occurrence date of the charge in YYYY-MM-DD format',
					},
					{
						displayName: 'Document Date',
						name: 'document_date',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
						description: 'Document date of the charge in YYYY-MM-DD format',
					},
					{
						displayName: 'Due Date',
						name: 'due_date',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
						description: 'Due date of the charge in YYYY-MM-DD format',
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
				resource: ['claim'],
			},
		},
		options: [
			{
				name: 'paymentsValues',
				displayName: 'Payment',
				values: [
					{
						displayName: 'Your Reference',
						name: 'your_reference',
						type: 'string',
						default: '',
						description: 'Your reference for this payment',
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
						displayName: 'Value Date',
						name: 'value_date',
						type: 'string',
						default: '',
						placeholder: 'YYYY-MM-DD',
						description: 'Date of the payment in YYYY-MM-DD format',
					},
				],
			},
		],
	},
];

/**
 * Validates claim data according to Paywise API requirements
 * @see https://api.paywise.org/v1/docs/#tag/claims/operation/create-claim
 */
export function validateClaimData(this: IExecuteFunctions, claimData: IClaimData): void {
	// Format all dates to ensure they're in YYYY-MM-DD format
	claimData.due_date = formatDate(claimData.due_date) as string;
	claimData.occurence_date = formatDate(claimData.occurence_date);
	claimData.document_date = formatDate(claimData.document_date); 
	claimData.reminder_date = formatDate(claimData.reminder_date);
	claimData.delay_date = formatDate(claimData.delay_date);
	
	// Format payment dates if present
	if (claimData.payments && claimData.payments.length > 0) {
		claimData.payments.forEach(payment => {
			payment.value_date = formatDate(payment.value_date) as string;
		});
	}
	
	// Format additional charge dates if present
	if (claimData.additional_charges && claimData.additional_charges.length > 0) {
		claimData.additional_charges.forEach(charge => {
			charge.occurence_date = formatDate(charge.occurence_date);
			charge.document_date = formatDate(charge.document_date);
			charge.due_date = formatDate(charge.due_date);
		});
	}
	
	// Validate consistency between additional_charges_amount and additional_charges
	if (claimData.additional_charges_amount && 
	    (!claimData.additional_charges || claimData.additional_charges.length === 0)) {
		console.log('[validateClaimData] Additional charges amount provided without individual charges');
		// If additional_charges_amount is provided but no additional_charges, 
		// remove additional_charges_amount to ensure consistency
		delete claimData.additional_charges_amount;
		console.log('[validateClaimData] Removed additional_charges_amount to ensure API compatibility');
	}
	
	// Required fields validation
	const requiredFields = [
		{ key: 'debtor', label: 'Debtor ID' },
		{ key: 'your_reference', label: 'Your Reference' },
		{ key: 'due_date', label: 'Due Date' },
		{ key: 'subject_matter', label: 'Subject Matter' },
		{ key: 'total_claim_amount', label: 'Total Claim Amount' },
		{ key: 'main_claim_amount', label: 'Main Claim Amount' },
		{ key: 'starting_approach', label: 'Starting Approach' },
		{ key: 'claim_disputed', label: 'Claim Disputed' },
		{ key: 'obligation_fulfilled', label: 'Obligation Fulfilled' }
	];
	
	for (const field of requiredFields) {
		if (claimData[field.key] === undefined || claimData[field.key] === null || claimData[field.key] === '') {
			throw new NodeOperationError(this.getNode(), `Required field "${field.label}" is missing or empty`);
		}
	}
	
	// Amount validations
	if (!claimData.main_claim_amount || !claimData.main_claim_amount.value) {
		throw new NodeOperationError(
			this.getNode(),
			`Main claim amount value is missing`
		);
	}
	
	if (!claimData.total_claim_amount || !claimData.total_claim_amount.value) {
		throw new NodeOperationError(
			this.getNode(),
			`Total claim amount value is missing`
		);
	}
	
	// Date format validation
	const dateFields = [
		{ key: 'due_date', label: 'Due Date' },
		{ key: 'occurence_date', label: 'Occurrence Date', optional: true },
		{ key: 'document_date', label: 'Document Date', optional: true },
		{ key: 'reminder_date', label: 'Reminder Date', optional: true },
		{ key: 'delay_date', label: 'Delay Date', optional: true }
	];
	
	for (const field of dateFields) {
		if (claimData[field.key] || !field.optional) {
			if (!/^\d{4}-\d{2}-\d{2}$/.test(claimData[field.key] as string)) {
				throw new NodeOperationError(
					this.getNode(),
					`${field.label} must be in YYYY-MM-DD format, got: ${claimData[field.key]}`
				);
			}
		}
	}
	
	// StartingApproach validation
	if (claimData.starting_approach && !['extrajudicial', 'judicial', 'mail'].includes(claimData.starting_approach)) {
		throw new NodeOperationError(
			this.getNode(),
			`Starting Approach must be either 'extrajudicial', 'judicial', or 'mail', got: ${claimData.starting_approach}`
		);
	}
	
	// Boolean field validations
	if (claimData.claim_disputed !== undefined && typeof claimData.claim_disputed !== 'boolean') {
		throw new NodeOperationError(
			this.getNode(),
			`Claim Disputed must be a boolean, got: ${typeof claimData.claim_disputed}`
		);
	}
	
	if (claimData.obligation_fulfilled !== undefined && typeof claimData.obligation_fulfilled !== 'boolean') {
		throw new NodeOperationError(
			this.getNode(),
			`Obligation Fulfilled must be a boolean, got: ${typeof claimData.obligation_fulfilled}`
		);
	}
	
	// Validate items if present
	if (claimData.items && claimData.items.length > 0) {
		claimData.items.forEach((item, index) => {
			if (!item.description) {
				throw new NodeOperationError(
					this.getNode(),
					`Item #${index + 1} is missing a description`
				);
			}
			
			if (typeof item.quantity !== 'number' || item.quantity <= 0) {
				throw new NodeOperationError(
					this.getNode(),
					`Item #${index + 1} must have a positive quantity, got: ${item.quantity}`
				);
			}
			
			if (!item.amount) {
				throw new NodeOperationError(
					this.getNode(),
					`Item #${index + 1} is missing an amount`
				);
			}
			
			if (!item.amount.value || !/^\d+(\.\d{1,2})?$/.test(item.amount.value)) {
				throw new NodeOperationError(
					this.getNode(),
					`Item #${index + 1} has an invalid amount value: ${item.amount?.value}`
				);
			}
			
			const validCurrencies = ['EUR', 'USD'];
			if (!validCurrencies.includes(item.amount.currency)) {
				throw new NodeOperationError(
					this.getNode(),
					`Item #${index + 1} has an unsupported currency: ${item.amount.currency}. Supported currencies: ${validCurrencies.join(', ')}`
				);
			}
		});
	}
	
	// Validate additional charges if present
	if (claimData.additional_charges && claimData.additional_charges.length > 0) {
		claimData.additional_charges.forEach((charge, index) => {
			if (!charge.subject_matter) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} is missing a subject matter`
				);
			}
			
			if (!charge.amount) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} is missing an amount`
				);
			}
			
			if (!charge.amount.value || !/^\d+(\.\d{1,2})?$/.test(charge.amount.value)) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} has an invalid amount value: ${charge.amount?.value}`
				);
			}
			
			const validCurrencies = ['EUR', 'USD'];
			if (!validCurrencies.includes(charge.amount.currency)) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} has an unsupported currency: ${charge.amount.currency}. Supported currencies: ${validCurrencies.join(', ')}`
				);
			}
			
			// Validate dates if provided
			if (charge.occurence_date && !/^\d{4}-\d{2}-\d{2}$/.test(charge.occurence_date)) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} has an invalid occurrence date format: ${charge.occurence_date}`
				);
			}
			
			if (charge.document_date && !/^\d{4}-\d{2}-\d{2}$/.test(charge.document_date)) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} has an invalid document date format: ${charge.document_date}`
				);
			}
			
			if (charge.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(charge.due_date)) {
				throw new NodeOperationError(
					this.getNode(),
					`Additional charge #${index + 1} has an invalid due date format: ${charge.due_date}`
				);
			}
		});
	}
	
	// Validate additional charges amount if present
	if (claimData.additional_charges_amount) {
		if (!claimData.additional_charges_amount.value || !/^\d+(\.\d{1,2})?$/.test(claimData.additional_charges_amount.value)) {
			throw new NodeOperationError(
				this.getNode(),
				`Additional charges sum has an invalid amount value: ${claimData.additional_charges_amount.value}`
			);
		}
		
		const validCurrencies = ['EUR', 'USD'];
		if (!validCurrencies.includes(claimData.additional_charges_amount.currency)) {
			throw new NodeOperationError(
				this.getNode(),
				`Additional charges sum has an unsupported currency: ${claimData.additional_charges_amount.currency}. Supported currencies: ${validCurrencies.join(', ')}`
			);
		}
	}
	
	// Validate payments if present
	if (claimData.payments && claimData.payments.length > 0) {
		claimData.payments.forEach((payment, index) => {
			if (!payment.your_reference) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} is missing a reference`
				);
			}
			
			if (!payment.amount) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} is missing an amount`
				);
			}
			
			if (!payment.amount.value || !/^\d+(\.\d{1,2})?$/.test(payment.amount.value)) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} has an invalid amount value: ${payment.amount?.value}`
				);
			}
			
			const validCurrencies = ['EUR', 'USD'];
			if (!validCurrencies.includes(payment.amount.currency)) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} has an unsupported currency: ${payment.amount.currency}. Supported currencies: ${validCurrencies.join(', ')}`
				);
			}
			
			if (!payment.value_date) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} is missing a date`
				);
			}
			
			if (!/^\d{4}-\d{2}-\d{2}$/.test(payment.value_date)) {
				throw new NodeOperationError(
					this.getNode(),
					`Payment #${index + 1} has an invalid date format: ${payment.value_date}`
				);
			}
		});
	}
}

/**
 * Ensures a date string is in YYYY-MM-DD format by removing any time component
 */
function formatDate(dateStr: string | undefined): string | undefined {
	if (!dateStr) return undefined;
	return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
}

/**
 * Maps node parameters to the IClaimData interface
 */
export function mapToClaimData(this: IExecuteFunctions): IClaimData {
	const inputType = this.getNodeParameter('inputType', 0) as string;
	
	if (inputType === 'json') {
		const jsonData = JSON.parse(this.getNodeParameter('jsonData', 0) as string) as IClaimData;
		// Ensure dates are in YYYY-MM-DD format
		jsonData.due_date = formatDate(jsonData.due_date) as string;
		jsonData.occurence_date = formatDate(jsonData.occurence_date);
		jsonData.document_date = formatDate(jsonData.document_date);
		jsonData.reminder_date = formatDate(jsonData.reminder_date);
		jsonData.delay_date = formatDate(jsonData.delay_date);
		
		if (jsonData.payments && jsonData.payments.length > 0) {
			jsonData.payments.forEach(payment => {
				payment.value_date = formatDate(payment.value_date) as string;
			});
		}
		
		if (jsonData.additional_charges && jsonData.additional_charges.length > 0) {
			jsonData.additional_charges.forEach(charge => {
				charge.occurence_date = formatDate(charge.occurence_date);
				charge.document_date = formatDate(charge.document_date);
				charge.due_date = formatDate(charge.due_date);
			});
		}
		
		return jsonData;
	}
	
	// Get basic claim information
	const debtor = this.getNodeParameter('debtor', 0) as string;
	const your_reference = this.getNodeParameter('your_reference', 0) as string;
	const main_claim_amount_value = this.getNodeParameter('main_claim_amount_value', 0) as string;
	const main_claim_amount_currency = this.getNodeParameter('main_claim_amount_currency', 0, 'EUR') as string;
	const total_claim_amount_value = this.getNodeParameter('total_claim_amount_value', 0) as string;
	const total_claim_amount_currency = this.getNodeParameter('total_claim_amount_currency', 0, 'EUR') as string;
	const due_date = formatDate(this.getNodeParameter('due_date', 0) as string) as string;
	const subject_matter = this.getNodeParameter('subject_matter', 0) as string;

	// Get optional dates
	const occurence_date = formatDate(this.getNodeParameter('occurence_date', 0, '') as string);
	const document_date = formatDate(this.getNodeParameter('document_date', 0, '') as string);
	const reminder_date = formatDate(this.getNodeParameter('reminder_date', 0, '') as string);
	const delay_date = formatDate(this.getNodeParameter('delay_date', 0, '') as string);
	
	// Get other optional fields
	const document_reference = this.getNodeParameter('document_reference', 0, '') as string || undefined;
	const starting_approach = this.getNodeParameter('starting_approach', 0, 'extrajudicial') as string;
	const claim_disputed = this.getNodeParameter('claim_disputed', 0, false) as boolean;
	const obligation_fulfilled = this.getNodeParameter('obligation_fulfilled', 0, true) as boolean;

	// Get items
	const itemsCollection = this.getNodeParameter('items', 0, { itemsValues: [] }) as {
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
	
	// Only create additional_charges_amount if we have a value
	const additional_charges_amount = additionalChargesAmountValue ? {
		value: additionalChargesAmountValue,
		currency: additionalChargesAmountCurrency,
	} : undefined;

	// Get additional charges collection
	const additionalChargesCollection = this.getNodeParameter('additional_charges', 0, { additionalChargesValues: [] }) as {
		additionalChargesValues: Array<{
			your_reference: string;
			document_reference: string;
			subject_matter: string;
			occurence_date: string;
			document_date: string;
			due_date: string;
			amount_value: string;
			amount_currency: string;
		}>;
	};

	const additional_charges = (additionalChargesCollection.additionalChargesValues || []).map((charge) => ({
		your_reference: charge.your_reference,
		document_reference: charge.document_reference,
		subject_matter: charge.subject_matter,
		occurence_date: formatDate(charge.occurence_date),
		document_date: formatDate(charge.document_date),
		due_date: formatDate(charge.due_date),
		amount: {
			value: charge.amount_value,
			currency: charge.amount_currency,
		},
	}));

	// Get payments
	const paymentsCollection = this.getNodeParameter('payments', 0, { paymentsValues: [] }) as {
		paymentsValues: Array<{
			your_reference: string;
			amount_value: string;
			amount_currency: string;
			value_date: string;
		}>;
	};

	const payments = (paymentsCollection.paymentsValues || []).map((payment) => ({
		your_reference: payment.your_reference,
		amount: {
			value: payment.amount_value,
			currency: payment.amount_currency,
		},
		value_date: formatDate(payment.value_date) as string,
	}));

	// Combine all data
	const claimData: IClaimData = {
		debtor,
		your_reference,
		subject_matter,
		due_date,
		// Required amount fields
		main_claim_amount: {
			value: main_claim_amount_value,
			currency: main_claim_amount_currency,
		},
		total_claim_amount: {
			value: total_claim_amount_value,
			currency: total_claim_amount_currency,
		},
		// Add new required fields
		starting_approach,
		claim_disputed,
		obligation_fulfilled,
	};

	// Only add optional fields if they exist
	if (occurence_date) {
		claimData.occurence_date = occurence_date;
	}
	
	if (document_reference) {
		claimData.document_reference = document_reference;
	}
	
	if (document_date) {
		claimData.document_date = document_date;
	}
	
	if (reminder_date) {
		claimData.reminder_date = reminder_date;
	}
	
	if (delay_date) {
		claimData.delay_date = delay_date;
	}

	if (items.length > 0) {
		claimData.items = items;
	}

	if (additional_charges_amount) {
		claimData.additional_charges_amount = additional_charges_amount;
	}

	if (additional_charges.length > 0) {
		claimData.additional_charges = additional_charges;
	}

	if (payments.length > 0) {
		claimData.payments = payments;
	}

	return claimData;
}

export async function createClaim(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createClaim] operation function called');
	
	try {
		// Map node parameters to claim data
		const claimData = mapToClaimData.call(this);
		console.log('[createClaim] Data mapped, validating...');
		
		// Validate claim data before sending to API
		validateClaimData.call(this, claimData);
		console.log('[createClaim] Data validated successfully');
		
		// Make the API request
		console.log('[createClaim] Getting credentials and preparing request');
		const credentials = await this.getCredentials('paywiseApi');
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'claims');
		
		const options = {
			method: 'POST',
			url: url,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: claimData,
		};
		
		console.log('[createClaim] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createClaim] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createClaim] Error:', error);
		throw error;
	}
} 