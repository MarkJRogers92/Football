# Mac distribution: signing and notarisation

## Status: blocked on Apple credentials

The Alpha is ad-hoc signed (`identity: '-'` in `forge.config.js`). That makes it
launchable on this machine but triggers Gatekeeper friction anywhere else, and it
cannot be notarised. Checked on 2026-10-26:

- `security find-identity -v -p codesigning` → **0 valid identities**
- `~/.appstoreconnect/private_keys` → **absent**
- `xcrun notarytool` → present (1.1.0)

Nothing in the repo needs to change to unblock this; the missing pieces are account
level.

## What is required

1. **Apple Developer Program membership** (paid, annual). A free Apple ID cannot
   issue a Developer ID certificate or notarise.
2. **Developer ID Application** certificate installed in the login keychain.
   Verify with `security find-identity -v -p codesigning` showing
   `Developer ID Application: <name> (<TEAMID>)`.
3. **Notary credentials** — either an app-specific password for the Apple ID, or an
   App Store Connect API key (`.p8`, key id, issuer id) stored for `notarytool`.
4. **CI secrets** for the macOS packaging job: `APPLE_ID`, `APPLE_APP_PASSWORD`
   (or `APPLE_API_KEY_ID`/`APPLE_API_ISSUER`/`APPLE_API_KEY`), `APPLE_TEAM_ID`,
   and the base64 of the `.p12` certificate plus its password.

## Steps once the credentials exist

1. Replace the ad-hoc `osxSign` block in `forge.config.js` with the Developer ID
   identity (or `osxSign: { identity: process.env.APPLE_IDENTITY }`).
2. Add `@electron/notarize` and a `packageAfterCopy`/`postMake` hook that runs
   `notarytool submit --wait` and then `stapler staple` on the `.app`.
3. Pass the secrets into `.github/workflows/validate.yml` (`desktop-macos` job)
   and verify in CI with `codesign --verify --deep --strict` plus
   `spctl -a -vvv -t install`.
4. Do one manual release, install it on a clean Mac account, and confirm no
   Gatekeeper prompt before advertising signed builds.

## Why this is not done yet

Signing cannot be tested without the certificate, and shipping an untested signing
change would break the packaging job that currently produces working Alpha builds.
The doc is the honest stopping point until the account exists.
