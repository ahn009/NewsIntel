# Security Policy

## Supported Versions

NewsIntel is currently maintained on the `main` branch.

## Reporting a Vulnerability

Please do not open public GitHub issues for secrets, vulnerabilities, or abuse vectors.

Report security concerns privately to the repository owner, including:

- A clear description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix, if known

## API Key Safety

NewsIntel is a browser-only BYOK app. Do not commit real API keys to source files, `.env`, logs, screenshots, or GitHub issues.

If a key is exposed:

1. Revoke it immediately in Groq Console.
2. Create a new key.
3. Remove the old key from local files and browser storage.
4. Review git history and CI logs for exposure.

For a public multi-user service, use a backend proxy with server-side credentials, authentication, rate limiting, and abuse monitoring.
