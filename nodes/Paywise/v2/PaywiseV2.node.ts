import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { claimDescription, executeClaim } from './resources/claim';
import { claimDocumentDescription, executeClaimDocument } from './resources/claimDocument';
import { debtorDescription } from './resources/debtor/description';
import { executeDebtor } from './resources/debtor/execute';
import { executeInfo, infoDescription } from './resources/info';
import { executeMandate, mandateDescription } from './resources/mandate';
import { orderDescription } from './resources/order/description';
import { executeOrder } from './resources/order/execute';
import { executePayment, paymentDescription } from './resources/payment';
import { BinaryResult, type ExecutorResult } from './resources/shared';
import {
	executeSingleMandateStatement,
	executeStatement,
	singleMandateStatementDescription,
	statementDescription,
} from './resources/statement';
import { paywiseApiRequest } from './transport';

type ResourceExecutor = (
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<ExecutorResult>;

const executors: Record<string, ResourceExecutor> = {
	claim: executeClaim,
	claimDocument: executeClaimDocument,
	debtor: executeDebtor,
	info: executeInfo,
	mandate: executeMandate,
	order: executeOrder,
	payment: executePayment,
	singleMandateStatement: executeSingleMandateStatement,
	statement: executeStatement,
};

const versionDescription: INodeTypeDescription = {
	subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
	displayName: 'paywise',
	name: 'paywise',
	group: ['transform'],
	version: 2,
	description: 'Submit and track debt collection cases with the paywise API v2',
	defaults: {
		name: 'paywise',
	},
	inputs: [NodeConnectionTypes.Main],
	outputs: [NodeConnectionTypes.Main],
	credentials: [
		{
			name: 'paywiseV2Api',
			required: true,
		},
	],
	properties: [
		{
			displayName: 'Resource',
			name: 'resource',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'API Key Info', value: 'info' },
				{ name: 'Claim', value: 'claim' },
				{ name: 'Claim Document', value: 'claimDocument' },
				{ name: 'Debtor', value: 'debtor' },
				{
					name: 'Mandate',
					value: 'mandate',
					description: 'A case paywise works on after accepting an order',
				},
				{ name: 'Order', value: 'order' },
				{ name: 'Payment', value: 'payment' },
				{
					name: 'Single Mandate Statement',
					value: 'singleMandateStatement',
					description: 'Statement for one mandate (Aktenabrechnung)',
				},
				{
					name: 'Statement',
					value: 'statement',
					description: 'Collective statement (Sammelabrechnung)',
				},
			],
			default: 'order',
		},
		...orderDescription,
		...claimDescription,
		...claimDocumentDescription,
		...debtorDescription,
		...mandateDescription,
		...paymentDescription,
		...statementDescription,
		...singleMandateStatementDescription,
		...infoDescription,
	],
};

export class PaywiseV2 implements INodeType {
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

	methods = {
		loadOptions: {
			async getLegalForms(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const forms = (await paywiseApiRequest.call(
					this,
					'GET',
					'/v2/legal-forms/',
				)) as unknown as Array<{ code: string; label: string; description?: string }>;
				return forms.map((form) => ({
					name: form.label,
					value: form.code,
					description: form.description,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;
			try {
				const executor = executors[resource];
				if (!executor) {
					throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, {
						itemIndex: i,
					});
				}
				const result = await executor.call(this, operation, i);
				if (result instanceof BinaryResult) {
					returnData.push(...result.items);
					continue;
				}
				returnData.push(
					...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(result), {
						itemData: { item: i },
					}),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error instanceof NodeApiError || error instanceof NodeOperationError
					? error
					: new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
