import { IResourceFunctions } from '../../../interfaces';
import { getInfo, getInfoFields } from './getInfo';
import { INodeProperties } from 'n8n-workflow';

// Export operations
export const infoOperations: IResourceFunctions = {
	getInfo,
};

// Export operation fields
export const infoOperationFields: Record<string, INodeProperties[]> = {
	getInfo: getInfoFields,
}; 