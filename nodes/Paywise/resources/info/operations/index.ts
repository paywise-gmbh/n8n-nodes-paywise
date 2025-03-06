import { IResourceFunctions } from '../../../interfaces';
import { getInfo, getInfoFields } from './getInfo';
import { INodeProperties } from 'n8n-workflow';

// Export operations - use string keys to ensure operations can be accessed using string operation parameter
export const infoOperations: IResourceFunctions = {
	'getInfo': getInfo,
};

// Export operation fields
export const infoOperationFields: Record<string, INodeProperties[]> = {
	'getInfo': getInfoFields,
}; 