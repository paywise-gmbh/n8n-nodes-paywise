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
		// First try Case Management API (with trailing slash)
		let response: any;
		let error: any;
		
		try {
			const caseManagementUrl = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'info', '');
			console.log('[getInfo] Using Case Management API URL:', caseManagementUrl);
			
			// Make API request
			const caseManagementOptions = {
				method: 'GET',
				url: caseManagementUrl + '/', // Ensure trailing slash
				headers: {
					'Accept': 'application/json',
				},
			};
			
			console.log('[getInfo] Making authenticated API request to Case Management API');
			response = await this.helpers.requestWithAuthentication.call(
				this,
				'paywiseApi',
				caseManagementOptions,
			);
			console.log('[getInfo] Case Management API response received successfully');
		} catch (e) {
			console.log('[getInfo] Case Management API request failed, trying Partner API');
			error = e;
			
			// Try Partner API if Case Management API failed
			const partnerUrl = await getApiUrl.call(this, ApiType.PARTNER, 'info', '');
			console.log('[getInfo] Using Partner API URL:', partnerUrl);
			
			// Make API request
			const partnerOptions = {
				method: 'GET',
				url: partnerUrl + '/', // Ensure trailing slash
				headers: {
					'Accept': 'application/json',
				},
			};
			
			console.log('[getInfo] Making authenticated API request to Partner API');
			response = await this.helpers.requestWithAuthentication.call(
				this,
				'paywiseApi',
				partnerOptions,
			);
			console.log('[getInfo] Partner API response received successfully');
		}
		
		return JSON.parse(response);
	} catch (error) {
		console.error('[getInfo] Error:', error);
		throw error;
	}
} 