# vendor/

Third-party files shipped with the app so that it contacts no other host and works offline.

| File | Version | Source | License | sha512 (base64) |
|---|---|---|---|---|
| `pdf-lib.min.js` | 1.17.1 | `https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js` (unmodified) | MIT — [pdf-lib.LICENSE.md](pdf-lib.LICENSE.md) | `z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==` |

The hash equals the SRI value cdnjs publishes for this version (checked 2026-09-21).
Verify: `openssl dgst -sha512 -binary vendor/pdf-lib.min.js | openssl base64 -A`

Update: download the new version, check its hash against api.cdnjs.com, update this table and bump `CACHE` in `sw.js`.
