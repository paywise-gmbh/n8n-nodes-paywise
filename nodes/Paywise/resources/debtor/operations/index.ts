import { IResourceFunctions } from '../../../interfaces';
import { createDebtor, createDebtorFields } from './createDebtor';
import { getDebtor, getDebtorFields } from './getDebtor';
import { listDebtors, listDebtorsFields } from './listDebtors';
import { INodeProperties } from 'n8n-workflow';

// Export operations
export const debtorOperations: IResourceFunctions = {
	createDebtor,
	getDebtor,
	listDebtors,
};

// Export operation fields
export const debtorOperationFields: Record<string, INodeProperties[]> = {
	createDebtor: createDebtorFields,
	getDebtor: getDebtorFields,
	listDebtors: listDebtorsFields,
}; 