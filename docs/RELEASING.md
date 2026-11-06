# Release procedure

Releases are manual. CI verifies changes but does not publish releases or deploy either app. A GitHub source release is not approval to expose this scaffold to public traffic.

## Version and notes

- The root `package.json` version identifies the repository release; use a matching `vX.Y.Z` tag. App and shared-package versions are independent and need not match the root.
- Before the first release, confirm the intended version with the maintainer. The current 0.2.0 changelog entry describes repository history, not a prior published release.
- Use a patch increment for compatible fixes, a minor increment for new functionality, and explicitly document breaking changes. While below 1.0, use a minor increment for breaking changes.
- In a reviewed change, update the root version and any changed component versions that are being released. If workspace metadata changes, regenerate and review `package-lock.json` using the pinned npm version.
- Update `CHANGELOG.md` with user-visible changes, limitations and upgrade instructions. At publication, date the matching entry and remove its unpublished qualifier; keep an Unreleased section for later changes.

## Verify the exact release candidate

Use a clean checkout of the reviewed candidate commit, npm 11.6.2, Node 22.17.0 and Python 3.11, matching `.github/workflows/ci.yml`. Do not use an existing working directory containing user recordings as the build workspace.

```bash
npm ci --before="$(node -p 'new Date(Date.now() - 172800000).toISOString()')"
npm test
npm run check
npm run build
npm run test:production
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest -q
```

Stop on any failure or unexpected tracked-file change. Review warnings. Require successful CI for this exact commit, not merely the latest green run. Python dependencies currently use version ranges, so record the resolved environment for the release; byte-for-byte reproducibility is not guaranteed.

Smoke-test each built app independently on loopback using the commands in [SaaS stack](SAAS_STACK.md). Confirm the UI and health endpoint respond, unavailable audio services are reported honestly, and production upload/generation remain blocked. Never expose the unauthenticated Python prototypes.

## Publish only with maintainer approval

1. Obtain explicit approval for the release commit, tag and publication. Follow the repository's branch and PR workflow for feature changes; publishing and deploying require separate authorization.
2. After the approved changes are merged, confirm the tag version matches root `package.json` and the dated changelog entry. Confirm checks pass on the exact commit to be tagged.
3. Create an annotated `vX.Y.Z` tag at that commit and push only that tag. Do not replace or force-push an existing release tag.
4. Create a GitHub Release for the tag, copying the matching changelog entry and limitations. Mark scaffold releases as prereleases. Include the commit SHA, CI run link, runtime versions and affected app/package versions.
5. Verify the published tag and notes. These private workspace packages are not published to npm by this procedure.

## Deployment and rollback

Deployment is a separate, explicitly approved operation. Public deployment remains blocked by the authentication, tenancy, rights, storage and billing requirements in [SaaS stack](SAAS_STACK.md) and [Rights and safety](RIGHTS_AND_SAFETY.md).

For an approved private deployment, use the separate systemd examples and loopback bindings. Build in a new versioned directory, keep the previous known-good build and runtime configuration, and record which commit each app runs. Keep user data outside release directories. Deploy each app independently and verify its UI, health response and production restrictions before declaring success.

If a smoke check fails, stop promotion and return only the affected app's service to its previous known-good build and compatible configuration, restart it, and repeat the smoke checks. Do not delete recordings, restore old user data, reverse migrations or move release tags as part of code rollback. Future schema or storage changes require a separately reviewed migration and recovery plan before deployment. If no prior verified build exists, stop the affected service rather than claiming rollback succeeded.
