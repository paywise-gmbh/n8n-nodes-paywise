import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';

export interface PaywiseApiError {
	response?: {
		body: {
			message: string;
		};
	};
	message: string;
}

export interface IPaywiseCredentials {
	baseUrl: string;
}

export interface IResourceFunctions {
	[key: string]: (this: IExecuteFunctions) => Promise<JsonObject>;
}

export interface IResourceDescription {
	operations: INodeProperties[];
	properties: INodeProperties[];
} 