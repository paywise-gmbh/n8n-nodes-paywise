import { IResourceFunctions } from '../../../interfaces';
import { createClaim, createClaimFields } from './createClaim';
import { releaseClaim, releaseClaimFields } from './releaseClaim';
import { createAndReleaseClaim, createAndReleaseClaimFields } from './createAndReleaseClaim';
import { getClaim, getClaimFields } from './getClaim';
import { listClaims, listClaimsFields } from './listClaims';
import { uploadDocument, uploadDocumentFields } from './uploadDocument';
import { INodeProperties } from 'n8n-workflow';

// Export operations
export const claimOperations: IResourceFunctions = {
	createClaim,
	releaseClaim,
	createAndReleaseClaim,
	getClaim,
	listClaims,
	uploadDocument,
};

// Export operation fields
export const claimOperationFields: Record<string, INodeProperties[]> = {
	createClaim: createClaimFields,
	releaseClaim: releaseClaimFields,
	createAndReleaseClaim: createAndReleaseClaimFields,
	getClaim: getClaimFields,
	listClaims: listClaimsFields,
	uploadDocument: uploadDocumentFields,
}; 