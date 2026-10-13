# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-13

### Added

- paywise node version 2 for paywise API v2 (default for new workflows) with the resources Order, Claim, Claim Document, Debtor, Mandate, Payment, Statement, Single Mandate Statement and API Key Info. Documents and statements are uploaded from and downloaded to n8n binary fields; legal forms load from the API.
- paywise Trigger: starts workflows from paywise webhook events, registers and removes the webhook automatically and verifies signatures.
- Paywise V2 API credential with Production, Sandbox and Custom environments and a built-in connection test.
- Automatic `Idempotency-Key` on create, submit and withdraw, so retries never create duplicates.
- Themed light and dark icons.
- API errors show the paywise message, the failing field and the request ID.

### Changed

- Node version 1 (API v1) is frozen and kept for existing workflows.
- Build, lint, dev and release now use `@n8n/node-cli`; releases are staged on npm from GitHub Actions with provenance (Trusted Publishing) and go live after a maintainer approves them.
- Package metadata points to the public repository `paywise-gmbh/n8n-nodes-paywise`; author is paywise GmbH.

### Fixed

- The node icon was white only and invisible on n8n's light canvas.

## [0.2.2] - 2025-06-18

### Fixed

- 🔧 Fixed Release Claim operation to use PATCH instead of POST method for API compatibility
- 🔧 Fixed Additional Charges Amount not being sent properly in create claim requests when no individual charges are specified
- 📡 Added n8n User-Agent header (`n8n-paywise-node/1.0`) to all API requests for better request tracking and debugging

### Enhanced

- ✅ Maintained complete "Act on Behalf of Client" functionality across all Case Management API operations
- 🚀 Improved API request compatibility and debugging capabilities
- 📊 Enhanced request logging and error handling

### Technical Details

- All Case Management API operations now include both User-Agent and X-User-Id headers (when acting on behalf of clients)
- All Partner API operations now include User-Agent headers
- Release Claim operation now correctly uses PATCH method as required by the API
- Additional charges amount validation logic corrected to allow amount without individual charge items

## [0.2.0] - Previous Release

### Added

- Partner API integration with full company, user, and user invite management
- Case Management API integration with claim and debtor management
- Act on behalf of client functionality for Case Management API
- Comprehensive form field and JSON input support
- Document upload capabilities for claims
- Complete CRUD operations for all supported resources

### Features

- **Companies**: Create, update, retrieve, and list companies
- **Users**: Create users, retrieve user details, and list users
- **User Invites**: Create user invites, check invite status, and get onboarded user details
- **Claims**: Create, release, and manage debt collection claims with document support
- **Debtors**: Create and manage debtor records with comprehensive information
- **API Tokens**: Manage API tokens for authentication
