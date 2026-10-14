import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';

export interface PaywiseApiError {
	response?: {
		body: {
			message: string;
			errors?: Record<string, string[]>;
			status?: number;
			code?: string;
		};
		statusCode?: number;
		statusMessage?: string;
		headers?: Record<string, string>;
	};
	message: string;
	code?: string;
	stack?: string;
}

export interface IPaywiseCredentials {
	baseUrl: string;
	caseManagementApiSubpath?: string;
	partnerApiSubpath?: string;
}

export interface IResourceFunctions {
	[key: string]: (this: IExecuteFunctions) => Promise<JsonObject>;
}

export interface IResourceDescription {
	operations: INodeProperties[];
	properties: INodeProperties[];
}
