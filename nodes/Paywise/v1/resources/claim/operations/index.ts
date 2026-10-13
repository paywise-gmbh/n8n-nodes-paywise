import { createClaim, createClaimFields } from './createClaim';
import { releaseClaim, releaseClaimFields } from './releaseClaim';
import { createAndReleaseClaim, createAndReleaseClaimFields } from './createAndReleaseClaim';
import { getClaim, getClaimFields } from './getClaim';
import { listClaims, listClaimsFields } from './listClaims';
import { uploadDocument, uploadDocumentFields } from './uploadDocument';

// Export all operations and fields for direct access
export {
	// Operations
	createClaim,
	releaseClaim,
	createAndReleaseClaim,
	getClaim,
	listClaims,
	uploadDocument,
	
	// Fields
	createClaimFields,
	releaseClaimFields,
	createAndReleaseClaimFields,
	getClaimFields,
	listClaimsFields,
	uploadDocumentFields,
}; 