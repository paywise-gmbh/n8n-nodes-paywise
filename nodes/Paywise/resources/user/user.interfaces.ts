import { IDataObject } from 'n8n-workflow';
import { INotificationChannel } from '../company/company.interfaces';

export interface IUserData extends IDataObject {
	email: string;
	first_name: string;
	last_name: string;
	notification_channels?: INotificationChannel[];
}

export interface IUserCreateResponse extends IDataObject {
	href: string;
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	company: {
		href: string;
		id: string;
	};
	email_verified: boolean;
	notification_channels?: INotificationChannel[];
}

export interface IUserInviteData extends IDataObject {
	email: string;
	first_name: string;
	last_name: string;
	company_id: string;
	notification_channels?: INotificationChannel[];
}

export interface IUserInviteResponse extends IDataObject {
	href: string;
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	company: {
		href: string;
		id: string;
	};
	email_verified: boolean;
	notification_channels?: INotificationChannel[];
	invitation_token?: string;
}

export interface IUserListResponse extends IDataObject {
	items: IUserCreateResponse[];
	page_info: {
		total_items: number;
		limit: number;
		offset: number;
	};
} 