import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { executeInfo, infoDescription } from './resources/info';
import { orderDescription } from './resources/order/description';
import { executeOrder } from './resources/order/execute';

type ResourceExecutor = (
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<IDataObject | IDataObject[]>;

const executors: Record<string, ResourceExecutor> = {
	info: executeInfo,
	order: executeOrder,
};

const versionDescription: INodeTypeDescription = {
	displayName: 'paywise',
	name: 'paywise',
	// Resolved relative to Paywise.node.ts, which loads this version.
	icon: { light: 'file:../../icons/paywise.svg', dark: 'file:../../icons/paywise.dark.svg' },
	group: ['transform'],
	version: 2,
	subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
	description: 'Submit and track debt collection cases with the paywise API v2',
	defaults: {
		name: 'paywise',
	},
	usableAsTool: true,
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
				{
					name: 'API Key Info',
					value: 'info',
				},
				{
					name: 'Order',
					value: 'order',
				},
			],
			default: 'order',
		},
		...orderDescription,
		...infoDescription,
	],
};

// The icon is set in versionDescription above; the rule only inspects class fields.
// eslint-disable-next-line @n8n/community-nodes/icon-validation
export class PaywiseV2 implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			...versionDescription,
		};
	}

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
