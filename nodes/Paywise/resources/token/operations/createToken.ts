import { IExecuteFunctions } from 'n8n-core';
import { JsonObject, INodeProperties } from 'n8n-workflow';
import { ApiType, getApiUrl } from '../../../apiUtils';
import { ITokenData } from '../token.interfaces';

// Define operation field properties
export const createTokenFields: INodeProperties[] = [
	{
		displayName: 'Company ID',
		name: 'company_id',
		type: 'string',
		default: '',
		description: 'The ID of the company to create a token for',
	},
	{
		displayName: 'Scope',
		name: 'scope',
		type: 'options',
		default: 'read',
		options: [
			{
				name: 'Read Only',
				value: 'read',
				description: 'Read-only access token',
			},
			{
				name: 'Read and Write',
				value: 'read-write',
				description: 'Full access token',
			},
		],
	},
	{
		displayName: 'Valid Until',
		name: 'valid_until',
		type: 'dateTime',
		default: '',
		description: 'The expiration date of the token',
	},
];

export async function createToken(this: IExecuteFunctions): Promise<JsonObject> {
	console.log('[createToken] operation function called');
	
	try {
		// Get input parameters from tokenDetails collection
		const tokenDetails = this.getNodeParameter('tokenDetails', 0, {}) as ITokenData;
		
		// Validate required parameters
		if (!tokenDetails.company_id) {
			throw new Error('Company ID is required to create a token');
		}
		
		if (!tokenDetails.scope) {
			throw new Error('Token scope is required (read or read-write)');
		}
		
		// Validate scope value
		if (tokenDetails.scope !== 'read' && tokenDetails.scope !== 'read-write') {
			throw new Error('Invalid token scope: must be either "read" or "read-write"');
		}
		
		// Build token data
		const tokenData: ITokenData = {
			company_id: tokenDetails.company_id,
			scope: tokenDetails.scope,
		};
		
		if (tokenDetails.valid_until) {
			// Validate date format if provided
			try {
				const validUntilDate = new Date(tokenDetails.valid_until);
				if (isNaN(validUntilDate.getTime())) {
					throw new Error('Invalid date format for valid_until');
				}
				
				// Ensure the date is in the future
				if (validUntilDate <= new Date()) {
					throw new Error('Token expiration date must be in the future');
				}
				
				tokenData.valid_until = tokenDetails.valid_until;
			} catch (dateError: any) {
				throw new Error(`Invalid valid_until date: ${dateError.message || 'Unknown error'}`);
			}
		}
		
		// Get API URL
		const url = await getApiUrl.call(this, ApiType.PARTNER, 'tokens');
		
		// Make API request
		const options = {
			method: 'POST',
			url,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(tokenData),
		};
		
		console.log('[createToken] Making authenticated API request to:', url);
		console.log('[createToken] Request body:', tokenData);
		
		const response = await this.helpers.requestWithAuthentication.call(
			this,
			'paywiseApi',
			options,
		);
		
		console.log('[createToken] Response received successfully');
		return JSON.parse(response);
	} catch (error) {
		console.error('[createToken] Error creating token:', error);
		throw error;
	}
} 