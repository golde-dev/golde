# Example: Hetzner Cloud Server

This example provisions a Hetzner Cloud server and a Cloudflare A record
that points at the server's public IPv4.

## Required env vars

- `GOLDE_API_KEY`
- `HCLOUD_TOKEN` ([create one](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/))
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Usage

```sh
yarn golde:show
yarn golde:apply
```

## Resources

- HCloud Server `hetzner-server-1` (cpx11, ubuntu-22.04, fsn1)
- Cloudflare A record `hetzner-server-1.golde-cf.dev` pointing at the server's public IPv4
