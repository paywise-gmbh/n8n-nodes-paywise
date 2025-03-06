import { IResourceFunctions } from '../../../interfaces';
import { createDebtor, createDebtorFields } from './createDebtor';
import { getDebtor, getDebtorFields } from './getDebtor';
import { listDebtors, listDebtorsFields } from './listDebtors';
import { INodeProperties } from 'n8n-workflow';

// Export operations - use string keys to ensure operations can be accessed using string operation parameter
export const debtorOperations: IResourceFunctions = {
	'createDebtor': createDebtor,
	'getDebtor': getDebtor,
	'listDebtors': listDebtors,
};

// Export operation fields
export const debtorOperationFields: Record<string, INodeProperties[]> = {
	'createDebtor': createDebtorFields,
	'getDebtor': getDebtorFields,
	'listDebtors': listDebtorsFields,
}; 