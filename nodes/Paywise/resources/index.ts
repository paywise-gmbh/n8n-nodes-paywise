import {
	companyOperations,
	createCompany,
	getCompany,
	listCompanies,
	createCompanyFields,
	getCompanyFields,
	listCompaniesFields,
} from './company';

import {
	userOperations,
	getUser,
	inviteUser,
	listUsers,
	getUserFields,
	inviteUserFields,
	listUsersFields,
} from './user';

import {
	tokenOperations,
	getToken,
} from './token';

// Export all resource operations
export const operations = [
	...companyOperations,
	...userOperations,
	...tokenOperations,
	// Additional resources will be added here
];

// Export all resource operations function implementations
export {
	// Company operations
	createCompany,
	getCompany,
	listCompanies,
	
	// User operations
	getUser,
	inviteUser,
	listUsers,
	
	// Token operations
	getToken,
};

// Export all operation fields
export const operationFields = {
	// Company fields
	company: {
		create: createCompanyFields,
		get: getCompanyFields,
		list: listCompaniesFields,
	},
	// User fields
	user: {
		get: getUserFields,
		invite: inviteUserFields,
		list: listUsersFields,
	},
}; 