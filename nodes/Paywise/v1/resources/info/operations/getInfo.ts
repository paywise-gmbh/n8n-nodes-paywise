import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addCommonHeaders,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

// Define operation field properties
export const getInfoFields: INodeProperties[] = [
	// No required fields for this operation, but adding client switch
	{
		displayName: 'Act on Behalf of Client',
		name: 'actOnBehalfOfClient',
		type: 'boolean',
		default: false,
		description:
			'Whether to act on behalf of a client company when making the Case Management API request',
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		description: 'ID of the user to act on behalf of',
		required: true,
		displayOptions: {
			show: {
				actOnBehalfOfClient: [true],
			},
		},
	},
];

/**
 * Maps node parameters for getInfo operation
 */
export function mapGetInfoParams(this: IExecuteFunctions): Record<string, never> {
	// No parameters needed for this operation
	return {};
}

export async function getInfo(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get API URL using the getApiUrl function
		// First try Case Management API (with trailing slash)
		let response: string;

		try {
			const caseManagementUrl = await getApiUrl.call(this, ApiType.CASE_MANAGEMENT, 'info', '');

			// Make API request
			const caseManagementOptions = {
				method: 'GET',
				url: caseManagementUrl,
				headers: {
					Accept: 'application/json',
				},
			};

			// Add common headers (User-Agent and X-User-Id if acting on behalf of client)
			const optionsWithHeaders = addCommonHeaders.call(this, caseManagementOptions, 0);
			response = await paywiseV1Request.call(this, optionsWithHeaders);
		} catch {
			// Not a Case Management API key; try the Partner API.

			// Try Partner API if Case Management API failed
			const partnerUrl = await getApiUrl.call(this, ApiType.PARTNER, 'info', '');

			// Make API request
			const partnerOptions = {
				method: 'GET',
				url: partnerUrl,
				headers: {
					Accept: 'application/json',
				},
			};

			// Add User-Agent header for Partner API (no X-User-Id needed for Partner API)
			const partnerOptionsWithHeaders = addCommonHeaders.call(this, partnerOptions, 0);
			response = await paywiseV1Request.call(this, partnerOptionsWithHeaders);
		}

		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
