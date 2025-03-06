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
		this.helpers = helpers as IPaywiseHelpers;
	}

	// Claims
	async createClaim(claimData: IDataObject): Promise<JsonObject> {
		const options: IHttpRequestOptions = {
			method: 'POST',
			url: `${this.credentials.baseUrl}/claims/`,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: claimData,
		};

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
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

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
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

		const response = await this.helpers.requestWithAuthentication.call(
			this.helpers,
			'paywiseApi',
			options,
		);

		return JSON.parse(response);
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