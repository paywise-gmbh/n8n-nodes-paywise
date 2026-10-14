import type { IDataObject } from 'n8n-workflow';
export interface IUserInviteData {
	email: string;
	company: string;
	success_url: string;
	failure_url: string;
	first_name?: string;
	last_name?: string;
}

export interface IUserInviteResponse {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
	company: string;
	success_url: string;
	failure_url: string;
	invite_url: string;
	expiry: string;
	status: string;
}

export interface IUserInviteUserResponse {
	href: string;
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	company: string;
	email_verified: boolean;
	notification_channels: IDataObject[];
}
