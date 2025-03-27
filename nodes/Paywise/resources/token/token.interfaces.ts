import { IDataObject } from 'n8n-workflow';

export interface ITokenData extends IDataObject {
	scope: string;
	company_id: string;
	valid_until?: string;
}

export interface ITokenResponse extends IDataObject {
	href: string;
	id: string;
	token: string;
	scope: string;
	company: {
		href: string;
		id: string;
	};
	valid_until: string;
	created: string;
} 