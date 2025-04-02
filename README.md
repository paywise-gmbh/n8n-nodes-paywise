# paywise n8n Node

This n8n community node integrates with paywise, a leading German Debt Collection Agency (Inkassounternehmen), enabling you to automate your entire debt collection process through n8n workflows. The node provides comprehensive access to both paywise's Partner API and Case Management API, allowing seamless management of companies, users, claims, debtors, and the complete debt collection lifecycle.

## Key Benefits
- **Automated Debt Collection**: Streamline your entire debt collection process by automating claim submissions, debtor management, and payment tracking
- **Seamless Integration**: Connect your systems directly with Germany's innovative debt collection service
- **Process Efficiency**: Reduce manual work and accelerate collection times through automated workflows
- **Real-time Updates**: Stay informed about claim statuses and collection progress through automated notifications
- **Compliance**: Ensure all debt collection activities comply with German regulations and best practices

## Features

### Partner API Operations
- **Companies**: Create, update, retrieve, and list companies
- **Users**: Create users directly via API, retrieve user details, and list users
- **User Invites**: Create user invites, check invite status, and get onboarded user details
- **API Tokens**: Manage API tokens for authentication

### Case Management API Operations
- **Claims**: Create, release, and manage debt collection claims with support for:
  - Automated claim submission
  - Document management
  - Payment tracking
  - Status monitoring
  - Collection process automation
- **Debtors**: Create and manage debtor records with comprehensive information
- **Info**: Access API information and system status

## Installation

To use this node in your n8n instance:

```bash
npm install @paywise/n8n-nodes-paywise
```

## Configuration

1. Open your n8n instance
2. Go to Settings > Community Nodes
3. Click "Install" and search for "@paywise/n8n-nodes-paywise"
4. After installation, add new paywise credentials:
   - Base URL: Your paywise API URL (e.g., https://api.paywise.de/api/v1/)
   - API Key: Your paywise API key

## Usage

The node provides two main API integrations for automating your debt collection process:

### Partner API
- **Company Management**: Full CRUD operations for managing client companies
- **User Management**: Create and manage users with role-based access
- **User Invitations**: Streamlined user onboarding process
- **API Token Management**: Secure API access control

### Case Management API
- **Debt Collection Process**: Comprehensive claim management with support for:
  - Multiple claim types and debt categories
  - Automated document generation and management
  - Real-time status tracking
  - Payment monitoring
  - Collection workflow automation
  - Legal process integration
- **Debtor Management**: Comprehensive debtor information handling with:
  - Personal and organization details
  - Address management and verification
  - Communication channels
  - Bank account information
  - Payment history tracking

## Input Methods

Most operations support two input methods:
1. **Form Fields**: User-friendly form interface for data input
2. **JSON**: Direct JSON input for advanced use cases and bulk operations

## Authentication

The node uses API key authentication. Ensure your API key has the necessary permissions for the operations you plan to use.

## Error Handling

The node provides detailed error messages and logging for troubleshooting:
- Input validation errors
- API response errors
- Authentication issues
- Network connectivity problems

## Support

For support and feature requests:
- Email: info@paywise.de
- Documentation: https://api.paywise.org/v1/docs/

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the node:
```bash
npm run build
```