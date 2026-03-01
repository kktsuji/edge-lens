# EdgeLens: Infrastructure Architecture (STEP 4)

## Decisions

| Decision              | Choice                                                                   |
| --------------------- | ------------------------------------------------------------------------ |
| **Hosting platform**  | AWS Amplify (manages S3 + CloudFront + ACM automatically)                |
| **Domain name**       | `edgelens.tech` (custom domain configured in Amplify Console)            |
| **SSL/TLS**           | ACM certificate auto-provisioned by Amplify in `us-east-1`               |
| **S3 bucket policy**  | Managed by Amplify (private bucket, CloudFront OAC — no manual setup)    |
| **CloudFront**        | Managed by Amplify; cache invalidation triggered automatically on deploy |
| **CI/CD integration** | GitHub webhook — push to `main` triggers build + deploy in Amplify       |

## Rationale

- **Amplify replaces IaC**: No CDK or Terraform needed. Amplify provisions and wires S3, CloudFront, and ACM as a unit, eliminating boilerplate infrastructure code.
- **GitHub webhook**: Connecting the GitHub repo in Amplify Console sets up the webhook automatically. Every push to `main` runs `npm run build` and deploys the `dist/` output.
- **Branch-based environments**: `develop` branch can be connected as a separate Amplify environment for staging at no extra setup cost.
- **Cache invalidation**: Amplify invalidates the CloudFront distribution after each successful deploy — this was a manual step in the original CDK + GitHub Actions plan.
- **Custom domain**: `edgelens.tech` is configured via Amplify's domain management; it handles DNS verification and certificate issuance automatically.

## Tradeoffs Accepted

- **Less CloudFront control**: Cache policies (e.g., HTML 5 min, assets 1 year) are managed by Amplify's defaults. Fine-grained tuning is not easily exposed.
- **Amplify build cost**: Build minutes are billed separately from S3/CloudFront usage (free tier: 1000 min/month).
- **Mild vendor lock-in**: CI/CD is tied to Amplify's build system; migrating to GitHub Actions + CDK later is straightforward but requires effort.
