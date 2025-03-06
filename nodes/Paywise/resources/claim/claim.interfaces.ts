import { IDataObject } from 'n8n-workflow';

export interface IAmount {
	value: string;
	currency: string;
}

export interface IClaimItem {
	description: string;
	quantity: number;
	unit?: string;
	amount: IAmount;
}

export interface IAdditionalCharge {
	type: string;
	reference: string;
	description: string;
	amount: IAmount;
}

export interface IPayment {
	reference: string;
	amount: IAmount;
	date: string;
}

export interface IReleaseOptions {
	approach: string;
	claim_disputed: boolean;
	obligation_fulfilled: boolean;
}

export interface IClaimData extends IDataObject {
	debtorId: string;
	reference: string;
	amount: number;
	dueDate: string;
	description: string;
	items?: IClaimItem[];
	additional_charges_amount?: IAmount;
	additional_charges?: IAdditionalCharge[];
	payments?: IPayment[];
} 