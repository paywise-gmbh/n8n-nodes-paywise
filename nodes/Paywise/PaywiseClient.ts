import { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-core';
import { IDataObject, IHttpRequestOptions, JsonObject } from 'n8n-workflow';
import FormData = require('form-data');

interface IPaywiseHelpers extends IExecuteFunctions {
	requestWithAuthentication: (
		credentialsType: string,
		requestOptions: IHttpRequestOptions,
	) => Promise<any>;
}

export class PaywiseClient {
	private credentials: IDataObject;
	private helpers: IPaywiseHelpers;

	constructor(
		credentials: IDataObject,
		helpers: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	) {
		this.credentials = credentials;
		
		// Check if helpers has requestWithAuthentication method using type assertion
		if (typeof (helpers as any).requestWithAuthentication === 'function') {
			this.helpers = helpers as IPaywiseHelpers;
		} else {
			// If not, for n8n compatibility, try binding the method from the prototype
			console.log('[PaywiseClient] Helpers object structure:', 
				JSON.stringify({
					hasHelpers: !!helpers,
					hasRequestWithAuth: !!(helpers && 'requestWithAuthentication' in helpers),
					helperKeys: helpers ? Object.keys(helpers) : []
				})
			);
			
			// Log function details if it exists
			if (helpers && 'requestWithAuthentication' in helpers) {
				console.log('[PaywiseClient] requestWithAuthentication is:', 
					typeof (helpers as any).requestWithAuthentication
				);
			}
			
			// Try to use the helper as is, but with a warning
			console.warn('[PaywiseClient] Helper object may not be properly structured - using as is');
			this.helpers = helpers as IPaywiseHelpers;
		}
		
		console.log('[PaywiseClient] Constructor called with credentials:', 
			JSON.stringify({
				baseUrl: credentials.baseUrl,
				hasCredentials: !!credentials,
				hasHelpers: !!helpers,
				hasRequestWithAuth: !!(this.helpers && typeof (this.helpers as any).requestWithAuthentication === 'function')
			})
		);
	}

	// Claims
	async createClaim(claimData: IDataObject): Promise<JsonObject> {
		console.log('[PaywiseClient] createClaim called with data:', JSON.stringify({
			dataType: typeof claimData,
			isEmpty: Object.keys(claimData).length === 0,
			hasDebtorId: 'debtorId' in claimData
		}));

		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.credentials.baseUrl}/claims/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: claimData,
		};

		try {
			const response = await this.helpers.requestWithAuthentication.call(
				this.helpers,
				'paywiseApi',
				options,
			);
			console.log('[PaywiseClient] createClaim response received');
			return JSON.parse(response);
		} catch (error) {
			console.error('[PaywiseClient] createClaim error:', error);
			throw error;
		}
	}

	async releaseClaim(claimId: string): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'PATCH',
			url: `${this.credentials.baseUrl}/claims/${claimId}/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: {
				submission_state: 'released',
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
	}

	async getClaim(claimId: string): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.credentials.baseUrl}/claims/${claimId}/`,
			headers: {
				'Accept': 'application/json',
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
	}

	async listClaims(limit: number = 10, offset: number = 0): Promise<JsonObject> {
		console.log('[PaywiseClient] listClaims called with:', { limit, offset });
		
		// Verify the helpers object has the required method
		if (!this.helpers || typeof (this.helpers as any).requestWithAuthentication !== 'function') {
			console.error('[PaywiseClient] Missing required requestWithAuthentication method on helpers object');
			throw new Error('Missing required helper methods for API authentication');
		}
		
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.credentials.baseUrl}/claims/`,
			headers: {
				'Accept': 'application/json',
			},
			qs: {
				limit,
				offset,
			},
		};

		try {
			console.log('[PaywiseClient] Making authenticated request to /claims/');
			const response = await this.helpers.requestWithAuthentication.call(
				this.helpers,
				'paywiseApi',
				options,
			);
			console.log('[PaywiseClient] listClaims response received');
			return JSON.parse(response);
		} catch (error) {
			console.error('[PaywiseClient] listClaims error:', error);
			
			// Provide more details if the error is related to the requestWithAuthentication method
			if (error instanceof TypeError && error.message.includes('requestWithAuthentication')) {
				throw new Error(`Authentication method error: ${error.message}. Helper structure may be incorrect.`);
			}
			
			throw error;
		}
	}

	async uploadClaimDocument(
		claimId: string,
		fileBuffer: Buffer,
		fileName: string,
		contentType: string,
	): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.credentials.baseUrl}/claims/${claimId}/documents/`,
			headers: {
				'Accept': 'application/json',
			},
			body: {
				file: {
					value: fileBuffer,
					options: {
						filename: fileName,
						contentType,
					},
				},
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
	}

	// Debtor methods
	async createDebtor(debtorData: IDataObject): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.credentials.baseUrl}/debtors/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: debtorData,
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
	}

	async getDebtor(debtorId: string): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.credentials.baseUrl}/debtors/${debtorId}/`,
			headers: {
				'Accept': 'application/json',
			},
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
	}

	async listDebtors(limit: number = 10, offset: number = 0): Promise<JsonObject> {
		console.log('[PaywiseClient] listDebtors called with:', { limit, offset });
		
		// Verify the helpers object has the required method
		if (!this.helpers || typeof (this.helpers as any).requestWithAuthentication !== 'function') {
			console.error('[PaywiseClient] Missing required requestWithAuthentication method on helpers object');
			throw new Error('Missing required helper methods for API authentication');
		}
		
		const options: IHttpRequestOptions = {
			method: 'GET',
			url: `${this.credentials.baseUrl}/debtors/`,
			headers: {
				'Accept': 'application/json',
			},
			qs: {
				limit,
				offset,
			},
		};

		try {
			console.log('[PaywiseClient] Making authenticated request to /debtors/');
			const response = await this.helpers.requestWithAuthentication.call(
				this.helpers,
				'paywiseApi',
				options,
			);
			console.log('[PaywiseClient] listDebtors response received');
			return JSON.parse(response);
		} catch (error) {
			console.error('[PaywiseClient] listDebtors error:', error);
			
			// Provide more details if the error is related to the requestWithAuthentication method
			if (error instanceof TypeError && error.message.includes('requestWithAuthentication')) {
				throw new Error(`Authentication method error: ${error.message}. Helper structure may be incorrect.`);
			}
			
			throw error;
		}
	}

	// Helper methods
	getContentType(fileName: string): string {
		const fileExtension = fileName.split('.').pop()?.toLowerCase();
		switch (fileExtension) {
			case 'pdf':
				return 'application/pdf';
			case 'jpg':
			case 'jpeg':
				return 'image/jpeg';
			case 'png':
				return 'image/png';
			case 'docx':
				return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
			case 'xlsx':
				return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
			default:
				return 'application/octet-stream';
		}
	}
} 