import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';

// Define operation field properties
export const getInfoFields: INodeProperties[] = [
	// No fields needed for this operation
];

/**
 * Maps node parameters for getInfo operation
 */
export function mapGetInfoParams(this: IExecuteFunctions): Record<string, never> {
	// No parameters needed for this operation
	return {};
}

export async function getInfo(this: IExecuteFunctions): Promise<JsonObject> {
	// No parameters to map for this operation
	
	// Make the API request
	const credentials = await this.getCredentials('paywiseApi');
	const options = {
		method: 'GET',
		url: `${credentials.baseUrl}/info/`,
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
} 