# EdgeLens: CI/CD Pipeline (STEP 5)

## Decisions

| Decision              | Choice                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| **CI/CD platform**    | AWS Amplify built-in CI/CD (no GitHub Actions required)                |
| **Trigger**           | GitHub webhook — push to connected branch triggers build automatically |
| **Build spec**        | `amplify.yml` in repo root                                             |
| **Pipeline steps**    | install → lint → test → build → deploy                                 |
| **Production branch** | `main` → Amplify production environment (`edgelens.tech`)              |
| **Staging branch**    | `develop` → Amplify staging environment (`dev.edgelens.tech`)          |
| **AWS credentials**   | Managed by Amplify — no OIDC, IAM users, or GitHub Secrets needed      |

## `amplify.yml` Build Spec

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npm run lint
        - npm run test
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

## Branch → Environment Mapping

| Branch    | Amplify Environment | URL                         |
| --------- | ------------------- | --------------------------- |
| `main`    | Production          | `https://edgelens.tech`     |
| `develop` | Staging             | `https://dev.edgelens.tech` |

## Rationale

- **Zero credential management**: Amplify's service role handles all AWS permissions internally. No OIDC setup or long-lived IAM keys in GitHub Secrets.
- **Integrated cache invalidation**: CloudFront invalidation runs automatically after each successful deploy — no extra pipeline step needed.
- **Branch environments**: Connecting `develop` in Amplify Console creates a fully isolated staging environment with its own CloudFront distribution, at no extra setup cost.
- **Build caching**: `node_modules` is cached between builds, keeping install time minimal.
- **`amplify.yml` in repo**: Build spec is version-controlled alongside the app, making build changes reviewable via pull requests.

## Tradeoffs Accepted

- **Less pipeline flexibility**: Amplify's build environment is managed; adding custom Docker images or complex matrix jobs requires migrating to GitHub Actions.
- **Build minute billing**: Amplify bills build minutes separately (free tier: 1000 min/month). High commit frequency on both branches could exceed the free tier.
- **No PR preview by default**: Pull request preview environments (Amplify Web Previews) must be explicitly enabled in the Amplify Console.
