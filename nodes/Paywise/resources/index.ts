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
	createToken,
	getToken,
	deleteToken,
	listTokens,
	createTokenFields,
	getTokenFields,
	deleteTokenFields,
	listTokensFields,
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
	createToken,
	getToken,
	deleteToken,
	listTokens,
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
	// Token fields
	token: {
		create: createTokenFields,
		get: getTokenFields,
		delete: deleteTokenFields,
		list: listTokensFields,
	},
	// Additional resources will be added here
}; 