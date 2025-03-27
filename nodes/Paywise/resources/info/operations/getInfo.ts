import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';

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
	console.log('[getInfo] operation function called');
	
	try {
		// Get API URL using the getApiUrl function
		const url = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'info');
		
		console.log('[getInfo] Using URL:', url);
		
		// Make API request
		const options = {
			method: 'GET',
			url,
			headers: {
				'Accept': 'application/json',
			},
		};
		
		console.log('[getInfo] Making authenticated API request');
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[getInfo] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[getInfo] Error:', error);
		throw error;
	}
} 