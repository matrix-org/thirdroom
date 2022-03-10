<div align="center">
  <img
    src="docs/assets/logo.png"
    alt="Third Room"
    width="420px"
    padding="40px"
  />
  <br/>
  <br/>
</div>

[![Matrix](https://img.shields.io/matrix/thirdroom-dev:matrix.org)](https://matrix.to/#/#thirdroom-dev:matrix.org)

# Third Room

A browser-based open metaverse client

- Federated infrastructure built on the [Matrix](https://matrix.org/) protocol
- Peer to Peer WebRTC Voice and Datachannels
- Tuned for performance with [bitECS](https://github.com/NateTheGreatt/bitecs) and [Three.js](https://threejs.org/)
- [Rapier.js](https://rapier.rs/) WASM based physics engine
- Implements the [Open Metaverse Interoperability group](https://omigroup.org)'s standards for glTF extensions

[Learn more about Third Room and our roadmap here](https://github.com/matrix-org/thirdroom/discussions/20)

## NOTE 2/8/2022: This project is undergoing a transition from a personal side project to a full time project managed by a team. We will be doing large refactoring of the repository in the coming weeks. Please do not start new projects against this repo as-is!

## Local Development

After you've installed node.js locally, run the following commands.

```
npm install -g yarn
yarn
yarn bootstrap
yarn start
```

Open http://localhost:3000

Thirdroom comes configured out of the box to communicate with the thirdroom.io homeserver so you don't need to set anything else up when developing against it.

## Hosting your own server

Thirdroom is a single page web app and can be hosted on a wide variety of services including:

- [Netlify](https://www.netlify.com/)
- [Cloudflare Worker Sites](https://developers.cloudflare.com/workers/platform/sites)
- [Digital Ocean App Platform](https://www.digitalocean.com/products/app-platform/)
- [Vercel](https://vercel.com/)
- [AWS S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- And many many more!

You can also host the client yourself with:

- [Caddy](https://caddyserver.com/docs/)
- [Nginx](https://nginx.org)
- Or any other web server

There is one main requirement for hosting, URL rewriting. Thirdroom only emits a single index.html file and relies on URL rewriting paths like `/rooms/:roomId` to `/index.html` for links to work. Ensure that your static web host has support for url rewriting or a catch-all route and point it at the `index.html` page.

The client currently includes one environment variable: `MATRIX_HOMESERVER_URL`. You'll want to set this to the path to your Matrix homeserver. Otherwise your client will be set to `https://matrix.thirdroom.io`. Which is fine in development, but you'll want to change it when testing against your own homeserver or deploying to production.

Example:

```
MATRIX_HOMESERVER_URL=https://matrix.thirdroom.io yarn build
```

Next you'll need to set up a Matrix Homeserver. We recommend using [this Ansible Playbook](https://github.com/spantaleev/matrix-docker-ansible-deploy). Even if you don't know about Ansible yet, you should be able to get up and running fairly quickly.

Thirdroom.io uses the following vars.yml file:

```yaml
# The bare domain name which represents your Matrix identity.
# Matrix user ids for your server will be of the form (`@user:<matrix-domain>`).
#
# Note: this playbook does not touch the server referenced here.
# Installation happens on another server ("matrix.<matrix-domain>").
#
# If you've deployed using the wrong domain, you'll have to run the Uninstalling step,
# because you can't change the Domain after deployment.
#
# Example value: example.com
matrix_domain: thirdroom.io

# This is something which is provided to Let's Encrypt when retrieving SSL certificates for domains.
#
# In case SSL renewal fails at some point, you'll also get an email notification there.
#
# If you decide to use another method for managing SSL certificates (different than the default Let's Encrypt),
# you won't be required to define this variable (see `docs/configuring-playbook-ssl-certificates.md`).
#
# Example value: someone@example.com
matrix_ssl_lets_encrypt_support_email: "xxxxxx"

# A shared secret (between Coturn and Synapse) used for authentication.
# You can put any string here, but generating a strong one is preferred (e.g. `pwgen -s 64 1`).
matrix_coturn_turn_static_auth_secret: "xxxxxx"

# A secret used to protect access keys issued by the server.
# You can put any string here, but generating a strong one is preferred (e.g. `pwgen -s 64 1`).
matrix_synapse_macaroon_secret_key: "xxxxxx"

# A Postgres password to use for the superuser Postgres user (called `matrix` by default).
#
# The playbook creates additional Postgres users and databases (one for each enabled service)
# using this superuser account.
matrix_postgres_connection_password: "xxxxxx"

matrix_synapse_workers_enabled: true

matrix_client_element_enabled: false

matrix_synapse_enable_registration: true

matrix_synapse_sentry_dsn: xxxxxx

matrix_synapse_log_level: "INFO"
matrix_synapse_storage_sql_log_level: "INFO"
matrix_synapse_root_log_level: "INFO"

matrix_synapse_rc_message:
  per_second: 1
  burst_count: 25
```

Thirdroom.io is hosted on a Shared 2 CPU, 2GB RAM Digital Ocean box that costs $15/mo. You could go with a cheaper or more expensive option on any host you please. Because we rely on homeserver federation for fetching rooms on other servers, you probably should pick an option with at least 2GB of RAM and 2 CPUs, but you may be able to get away with less with little to no performance cost.

> ## NOTE:
>
> Your server hardware will not affect your room capacity in thirdroom! Voice/Datachannels are established over peer to peer WebRTC connections. This means that room capacity is largely dependent on your user's network bandwidth. If you have expensive scenes to render that will also make it harder for your room to achieve larger numbers of users. You shouldn't expect more than around 12 concurrent users in a room.

You will need to configure Synapse to use a TURN server. The matrix-docker-ansible-deploy comes with one ([Coturn](https://github.com/coturn/coturn)) configured out of the box.

If you have more questions about self-hosting feel free to ask in [#thirdroom-dev:matrix.org](https://matrix.to/#/#thirdroom-dev:matrix.org). Please, before you ask a question about self-hosting Matrix servers, read the docs:

- [Synapse Docs](https://matrix-org.github.io/synapse/latest/setup/installation.html)
- [matrix-docker-ansible-deploy Docs](https://github.com/spantaleev/matrix-docker-ansible-deploy)
- [Coturn Docs](https://github.com/coturn/coturn)

## Customizing your client

Guide coming soon! We're still working on the API. Feel free to modify your own client and submit a PR with your improvements!
