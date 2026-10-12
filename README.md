# n8n-nodes-paywise

n8n community nodes for [paywise](https://paywise.de), the German debt collection service (Inkasso). Submit collection orders and react to case events from your n8n workflows.

The package contains:

- **paywise**: action node for the paywise API. Version 2 (default for new workflows) uses API v2; version 1 keeps existing workflows on API v1 running.
- **paywise Trigger**: starts a workflow when paywise sends a webhook event (API v2).

## Installation

In n8n, go to **Settings → Community Nodes → Install** and enter `@paywise/n8n-nodes-paywise`. See the [n8n community node docs](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

## Credentials

Use the **Paywise V2 API** credential with the paywise node v2 and the trigger.

1. Create an API key in the paywise portal. Keys belong to your company; a sandbox key starts with `pw_sbx_`.
2. In n8n, create a **Paywise V2 API** credential, pick the environment that matches the key (Production or Sandbox), and paste the key.
3. Save. n8n tests the key against `GET /v2/info/`.

Each API key has scopes. Grant at least `case:orders:write` to create and submit orders and `case:webhooks:write` for the trigger. See [Authentication and environments](https://docs.paywise.de/api-docs/essentials/authentication-and-environments).

Version 1 of the paywise node uses the older **Paywise API** credential for API v1.

## Operations (node version 2)

| Resource     | Operations                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------- |
| Order        | Create (optionally submit right away), Get, Get Many, Update, Delete draft, Submit, Withdraw |
| API Key Info | Get company, environment and scopes of the key in use                                        |

An order bundles the claims against one debtor. Create it as a draft with its claims, then submit it to paywise for review. The **Claims (JSON)** field takes the claim objects described in the [API reference](https://docs.paywise.de/api-docs/case-management-api/introduction).

### Safe retries

Every create, submit and withdraw request carries an `Idempotency-Key`. The node derives it from the execution, item and request body, so **Retry On Fail** returns the original result instead of creating a duplicate. Set your own key under **Options → Idempotency Key** (e.g. your invoice number) to also deduplicate across executions for 24 hours.

## Trigger

The **paywise Trigger** registers a webhook for the selected events when you activate the workflow and removes it when you deactivate it. Deliveries are verified against the webhook's signing secret; invalid signatures are rejected with `401`.

paywise only delivers to public HTTPS URLs, so your n8n instance must be reachable from the internet. Events include `order.accepted`, `order.rejected`, `mandate.state.changed`, `payment.reported` and `statement.published`; see [Webhooks](https://docs.paywise.de/api-docs/essentials/webhooks).

## Compatibility

Requires n8n 1.x or later. Node version 1 is frozen: it receives no new features and uses paywise API v1, which is deprecated.

## Development

Requires Node.js 22 (`nvm use`).

```bash
npm install
npm run dev     # starts n8n with the nodes and rebuilds on changes
npm run lint
npm run build && npm test
```

Releases are published to npm by GitHub Actions with provenance when a version tag is pushed (`npm run release`).

## Support

- Documentation: https://docs.paywise.de/
- Email: info@paywise.de

## License

[MIT](LICENSE.md)
