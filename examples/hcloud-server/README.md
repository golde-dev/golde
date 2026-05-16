# Example: Hetzner Cloud Server

This example provisions a Hetzner Cloud DNS zone, an SSH key, a server, and
a DNS A-record pointing at the server's public IPv4 — all managed end-to-end
via the Hetzner Cloud API.

## Generate the keypair

Generate a fresh keypair next to this `golde.config.ts` (the public key is
read from `./id_ed25519.pub` by the config; the private key is gitignored):

```sh
ssh-keygen -t ed25519 -N "" -f ./id_ed25519 -C "golde-example"
```

## Required env vars

- `GOLDE_API_KEY`
- `HCLOUD_TOKEN` ([create one](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/))

## Domain delegation

Golde creates the `golde.dev` zone on Hetzner's authoritative nameservers,
but the domain only resolves once you delegate it at your registrar:

- `hydrogen.ns.hetzner.com`
- `oxygen.ns.hetzner.com`
- `helium.ns.hetzner.de`

See <https://docs.hetzner.com/dns-console/dns/general/authoritative-name-servers>.
Replace `golde.dev` in the config with a domain you actually control before
applying.

## Usage

```sh
yarn golde:show
yarn golde:apply
```

## Resources

- HCloud DNS Zone `golde.dev` (primary, default TTL 86400)
- HCloud SSH Key `example-deploy` (publicKey from `./id_ed25519.pub`)
- HCloud Server `hetzner-server-1` (cpx11, ubuntu-22.04, fsn1; references the SSH key)
- HCloud DNS A record `hetzner-server-1.golde.dev` pointing at the server's public IPv4

## Note on rotating the SSH key

Hetzner installs SSH keys at server boot (via cloud-init `authorized_keys`).
Updating the `publicKey` field is rejected at plan time as immutable; even if
the key resource is recreated, **existing servers keep the old keys** —
Hetzner has no API to push new keys to a running server. To rotate keys on
a live server, either re-provision the server or update `~/.ssh/authorized_keys`
manually over SSH.
