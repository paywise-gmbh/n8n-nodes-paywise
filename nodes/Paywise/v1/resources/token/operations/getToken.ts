import type { IExecuteFunctions } from 'n8n-workflow';
import { JsonObject } from 'n8n-workflow';
import {
	ApiType,
	getApiUrl,
	addUserAgentHeader,
	paywiseV1Request,
	asNodeError,
} from '../../../apiUtils';

export async function getToken(this: IExecuteFunctions): Promise<JsonObject> {
	try {
		// Get API URL for info endpoint (this will return current token info)
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'info');

		// Make API request
		const options = {
			method: 'GET',
			url: url,
			headers: {
				Accept: 'application/json',
			},
		};

		// Add User-Agent header (Partner API doesn't use X-User-Id)
		const optionsWithHeaders = addUserAgentHeader(options);
		const response = await paywiseV1Request.call(this, optionsWithHeaders);
		return JSON.parse(response);
	} catch (error) {
		throw asNodeError(this.getNode(), error);
	}
}
