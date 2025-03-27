import { IDataObject } from 'n8n-workflow';

export interface IAddress {
	street: string;
	zip: string;
	city: string;
	country: string;
}

export interface ILegalRepresentative {
	type: string;
	name: string;
}

export interface INotificationChannel {
	channel_type: string;
	value: string;
	notification_types: string[];
}

export interface ICompanyData extends IDataObject {
	name: string;
	phone: string;
	address: IAddress;
	legal_form: string;
	tax_deduction_eligibility: string;
	vat_number?: string;
	legal_representatives?: ILegalRepresentative[];
	notification_channels?: INotificationChannel[];
	default_claim_type?: string;
	iban?: string;
	data_submission_completed?: boolean;
}

export interface ICompanyResponse extends IDataObject {
	href: string;
	id: string;
	name: string;
	address: IAddress;
	phone: string;
	vat_number?: string;
	users: IUserResponse[];
	data_submission_completed: boolean;
	legal_form: string;
	legal_representatives?: ILegalRepresentative[];
	tax_deduction_eligibility: string;
	notification_channels?: INotificationChannel[];
	default_claim_type?: string;
	iban?: string;
}

export interface IUserResponse extends IDataObject {
	href: string;
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	company: string;
	email_verified: boolean;
	notification_channels?: INotificationChannel[];
} 