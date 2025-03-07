import { IDataObject } from 'n8n-workflow';

export interface IAddress {
	street: string;
	zip: string;
	city: string;
	country: string;
}

export interface ICommunicationChannel {
	type: string;
	value: string;
}

export interface IBankAccount {
	iban: string;
	bic?: string;
}

export interface IPerson {
	salutation?: string;
	first_name: string;
	last_name: string;
	birth_date?: string;
	death_date?: string;
}

export interface IOrganization {
	name: string;
}

export interface IDebtorData extends IDataObject {
	your_reference: string;
	acting_as: string;
	person?: IPerson;
	organization?: IOrganization;
	addresses: IAddress[];
	communication_channels?: ICommunicationChannel[];
	bank_accounts?: IBankAccount[];
} 