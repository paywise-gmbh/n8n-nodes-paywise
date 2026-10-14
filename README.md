# n8n-nodes-paywise

n8n community nodes for [paywise](https://paywise.de), the German debt collection service (Inkasso). Submit collection orders and react to case events from your n8n workflows.

The package contains:

- **paywise**: action node for the paywise API. Version 2 (default for new workflows) uses API v2; version 1 keeps existing workflows on API v1 running.
- **paywise Trigger**: starts a workflow when paywise sends a webhook event (API v2).

## Installation

In n8n, go to **Settings → Community Nodes → Install** and enter `@paywise/n8n-nodes-paywise`. See the [n8n community node docs](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

## Credentials

Use the **Paywise Case Management API** credential with the paywise node v2 and the trigger.

1. Create an API key in the paywise portal. Keys belong to your company; a sandbox key starts with `pw_sbx_`.
2. In n8n, create a **Paywise Case Management API** credential, pick the environment that matches the key (Production or Sandbox), and paste the key.
3. Save. n8n tests the key against `GET /v2/info/`.

Each API key has scopes. Grant the scopes for the resources you use, e.g. `case:orders:write`, `case:debtors:write`, `case:payments:write`, `case:mandates:read`, `case:statements:read`, and `case:webhooks:write` for the trigger. See [Authentication and environments](https://docs.paywise.de/api-docs/essentials/authentication-and-environments).

Version 1 of the paywise node uses the older **Paywise API** credential for API v1.

## Operations (node version 2)

| Resource                 | Operations                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| Order                    | Create (optionally submit right away), Get, Get Many, Update, Delete draft, Submit, Withdraw |
| Claim                    | Create (in a draft order), Get, Get Many, Update, Delete                                     |
| Claim Document           | Upload (from a binary field), Get, Get Many, Download, Delete                                |
| Debtor                   | Create (consumer or business), Get, Get Many, Update                                         |
| Mandate                  | Get (optionally with history), Get Many, Get History, Get Documents, Download Document       |
| Payment                  | Report (on a claim or mandate), Get, Get Many, Delete (claim payments)                       |
| Statement                | Get, Get Many, Download (PDF or XLSX)                                                        |
| Single Mandate Statement | Get, Get Many, Download                                                                      |
| API Key Info             | Get company, environment and scopes of the key in use                                        |

A typical flow: create a debtor, create an order with its claims, upload documents to the claims, then submit the order. Once paywise accepts it, the order becomes a mandate; follow it with the trigger or the Mandate operations. An order bundles the claims against one debtor. Create it as a draft with its claims, then submit it to paywise for review. The **Claims (JSON)** field takes the claim objects described in the [API reference](https://docs.paywise.de/api-docs/case-management-api/introduction).

### Safe retries

Every create, upload, report, submit and withdraw request carries an `Idempotency-Key`. The node derives it from the execution, item and request body, so **Retry On Fail** returns the original result instead of creating a duplicate. Set your own key under **Options → Idempotency Key** (e.g. your invoice number) to also deduplicate across executions for 24 hours.

## Example workflows

Import these from the [`examples`](https://github.com/paywise-gmbh/n8n-nodes-paywise/tree/main/examples) folder (**Workflows → Import from File**) and select your paywise credential in each paywise node:

- [Hand over an overdue invoice](examples/hand-over-overdue-invoice.json): creates the debtor, then creates and submits the order. The invoice number serves as idempotency key, so running it twice does not create a second order.
- [Follow accepted orders](examples/follow-accepted-orders.json): the trigger fires on **Order Accepted** and **Mandate State Changed**, reads the case and returns its reference number, state and open balance.

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

Releases: `npm run release` on `main` bumps the version, tags and pushes. The tag starts a GitHub Actions workflow that stages the version on npm with provenance (npm Trusted Publishing). A maintainer then approves it with 2FA (`npm stage approve <stage-id>` or on npmjs.com) before it becomes installable.

## Support

- Documentation: https://docs.paywise.de/
- Email: info@paywise.de

## License

[MIT](LICENSE.md)
