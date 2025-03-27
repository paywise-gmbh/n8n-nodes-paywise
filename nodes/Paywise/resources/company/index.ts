import {
	createCompanyFields,
	createCompany,
	getCompanyFields,
	getCompany,
	listCompaniesFields,
	listCompanies,
} from './operations';

import {
	IAddress,
	ILegalRepresentative,
	INotificationChannel,
	ICompanyData,
	ICompanyResponse,
	IUserResponse,
} from './company.interfaces';

// Define the company resource operations
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
];

// Export all operations and fields
export {
	// Operations
	createCompany,
	getCompany,
	listCompanies,
	
	// Fields
	createCompanyFields,
	getCompanyFields,
	listCompaniesFields,
	
	// Interfaces
	IAddress,
	ILegalRepresentative,
	INotificationChannel,
	ICompanyData,
	ICompanyResponse,
	IUserResponse,
}; 