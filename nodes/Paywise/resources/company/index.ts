import { INodeProperties } from 'n8n-workflow';
import {
	createCompany,
	createCompanyFields,
	getCompany,
	getCompanyFields,
	listCompanies,
	listCompaniesFields,
} from './operations';

import {
	IAddress,
	ILegalRepresentative,
	INotificationChannel,
	ICompanyData,
	ICompanyResponse,
	IUserResponse,
} from './company.interfaces';

// Define the company resource operations (UI elements)
export const companyOperations = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['company'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new company',
				action: 'Create a company',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a company by ID',
				action: 'Get a company',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List all companies',
				action: 'List companies',
			},
		],
		default: 'list',
	},
	
	// Fields for create operation
	...createCompanyFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['create'],
				resource: ['company'],
			},
		},
	})),
	
	// Fields for get operation
	...getCompanyFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['get'],
				resource: ['company'],
			},
		},
	})),
	
	// Fields for list operation
	...listCompaniesFields.map(field => ({
		...field,
		displayOptions: {
			...field.displayOptions,
			show: {
				...(field.displayOptions?.show || {}),
				operation: ['list'],
				resource: ['company'],
			},
		},
	})),
];

// Mapping from UI operation values to function implementations
export const companyOperationMapping = {
	create: createCompany,
	get: getCompany,
	list: listCompanies,
};

// Export operations for direct access
export {
	// Operations
	createCompany,
	getCompany,
	listCompanies,
	
	// Interfaces
	IAddress,
	ILegalRepresentative,
	INotificationChannel,
	ICompanyData,
	ICompanyResponse,
	IUserResponse,
}; 