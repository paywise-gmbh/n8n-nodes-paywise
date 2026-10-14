import { IDataObject } from 'n8n-workflow';

export interface IAmount {
	value: string;
	currency: string;
}

export interface IMetadata {
	type: string;
	value: string;
}

export interface IEvent {
	title: string;
	occurence: string;
	your_reference?: string;
	description?: string;
	type?: string;
	location?: string;
}

export interface IClaimItem {
	description: string;
	quantity: number;
	unit?: string;
	amount: IAmount;
}

export interface IAdditionalCharge {
	your_reference?: string;
	document_reference?: string;
	subject_matter: string;
	occurence_date?: string;
	document_date?: string;
	due_date?: string;
	amount: IAmount;
	events?: IEvent[];
}

export interface IPayment {
	your_reference: string;
	amount: IAmount;
	value_date: string;
	metadata?: IMetadata[];
}

export interface IReleaseOptions {
	approach: string;
	claim_disputed: boolean;
	obligation_fulfilled: boolean;
}

export interface IClaimData extends IDataObject {
	debtor: string;
	your_reference: string;
	document_reference?: string;
	subject_matter: string;
	occurence_date?: string;
	document_date?: string;
	due_date: string;
	reminder_date?: string;
	delay_date?: string;
	total_claim_amount: IAmount;
	main_claim_amount: IAmount;
	items?: IClaimItem[];
	additional_charges_amount?: IAmount;
	additional_charges?: IAdditionalCharge[];
	payments?: IPayment[];
	starting_approach: string;
	claim_disputed: boolean;
	obligation_fulfilled: boolean;
	metadata?: IMetadata[];
	events?: IEvent[];
}
