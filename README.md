# Paywise n8n Node

This is a basic n8n node for Paywise integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the node:
```bash
npm run build
```

3. Start n8n with Docker:
```bash
docker-compose up -d
```

## Development
- The n8n interface will be available at: http://localhost:5678

## Testing

1. After starting n8n, the Paywise node will be available in the nodes panel
2. Add new Credentials with the following values:
    - Base URL: https://api.localhost:8006/api/v1/
    - API Key: your_api_key
3. Add the node to a workflow
4. Execute the workflow to test the basic functionality

## Building

To rebuild the node after making changes:

```bash
npm run build
docker-compose restart
``` 