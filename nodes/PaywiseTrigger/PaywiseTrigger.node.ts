import { randomUUID } from 'crypto';
import type {
	IDataObject,
	IHookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { paywiseApiRequest } from '../Paywise/v2/transport';
import { verifySignature } from './signature';

const EVENTS = [
	{ name: 'Mandate Balance Updated', value: 'mandate.balance_updated' },
	{ name: 'Mandate Correspondence Published', value: 'mandate.correspondence.published' },
	{ name: 'Mandate Created', value: 'mandate.created' },
	{ name: 'Mandate Message Created', value: 'mandate.message.created' },
	{ name: 'Mandate State Changed', value: 'mandate.state.changed' },
	{ name: 'Mandate Status Update Published', value: 'mandate.status_update.published' },
	{ name: 'Order Accepted', value: 'order.accepted' },
	{ name: 'Order Expired', value: 'order.expired' },
	{ name: 'Order Message Created', value: 'order.message.created' },
	{ name: 'Order Rejected', value: 'order.rejected' },
	{ name: 'Order Submitted', value: 'order.submitted' },
	{ name: 'Order Withdrawn', value: 'order.withdrawn' },
	{ name: 'Payment Reported', value: 'payment.reported' },
	{ name: 'Request to Client Answered', value: 'request_to_client.answered' },
	{ name: 'Request to Client Created', value: 'request_to_client.created' },
	{ name: 'Single Mandate Statement Cancelled', value: 'single_mandate_statement.cancelled' },
	{ name: 'Single Mandate Statement Published', value: 'single_mandate_statement.published' },
	{ name: 'Statement Cancelled', value: 'statement.cancelled' },
	{ name: 'Statement Published', value: 'statement.published' },
];

interface WebhookStaticData extends IDataObject {
	webhookId?: string;
	secret?: string;
}

function isNotFound(error: unknown) {
	return error instanceof NodeApiError && error.httpCode === '404';
}

export class PaywiseTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'paywise Trigger',
		name: 'paywiseTrigger',
		icon: { light: 'file:../../icons/paywise.svg', dark: 'file:../../icons/paywise.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when paywise sends a webhook event',
		defaults: {
			name: 'paywise Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'paywiseV2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName:
					'paywise only delivers to public HTTPS URLs. Your n8n instance must be reachable from the internet.',
				name: 'notice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: [{ name: 'All Events', value: '*' }, ...EVENTS],
				default: [],
				description: 'The events to listen to',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Verify Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description:
							'Whether to reject deliveries whose signature does not match the webhook secret',
					},
				],
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				if (!staticData.webhookId) return false;

				try {
					const webhook = await paywiseApiRequest.call(
						this,
						'GET',
						`/v2/webhooks/${staticData.webhookId}/`,
					);
					if (webhook.url === this.getNodeWebhookUrl('default')) return true;
				} catch (error) {
					if (!isNotFound(error)) {
						throw error instanceof NodeApiError
							? error
							: new NodeOperationError(this.getNode(), error as Error);
					}
				}
				delete staticData.webhookId;
				delete staticData.secret;
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const events = this.getNodeParameter('events') as string[];
				const body: IDataObject = {
					url: this.getNodeWebhookUrl('default'),
					events: events.includes('*') ? ['*'] : events,
					enabled: true,
					description: `n8n: ${this.getWorkflow().name ?? this.getWorkflow().id}`.slice(0, 200),
				};
				const webhook = await paywiseApiRequest.call(this, 'POST', '/v2/webhooks/', {
					body,
					idempotencyKey: randomUUID(),
				});

				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				staticData.webhookId = webhook.id as string;
				staticData.secret = webhook.secret_key as string;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
				if (staticData.webhookId) {
					try {
						await paywiseApiRequest.call(this, 'DELETE', `/v2/webhooks/${staticData.webhookId}/`);
					} catch (error) {
						if (!isNotFound(error)) return false;
					}
				}
				delete staticData.webhookId;
				delete staticData.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const options = this.getNodeParameter('options', {}) as IDataObject;

		if (options.verifySignature !== false) {
			const staticData = this.getWorkflowStaticData('node') as WebhookStaticData;
			const headers = this.getHeaderData();
			const valid = verifySignature({
				secret: staticData.secret ?? '',
				webhookId: String(headers['webhook-id'] ?? ''),
				timestamp: String(headers['webhook-timestamp'] ?? ''),
				signatureHeader: String(headers['webhook-signature'] ?? ''),
				rawBody: req.rawBody,
			});
			if (!valid) {
				this.getResponseObject().status(401).send('Invalid signature');
				return { noWebhookResponse: true };
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(this.getBodyData())],
		};
	}
}
