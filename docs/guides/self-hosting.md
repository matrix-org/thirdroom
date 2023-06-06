# Self Hosting Third Room

Third Room can be self-hosted, giving you even more control over the user experience and content distribution. By self-hosting, you can customize the client to meet your specific needs and requirements while still benefiting from the core functionality of Third Room.

Third Room is a single page web app (SPA) and can be hosted on any static web server. You do not need to host your own Matrix homeserver in order to customize or self-host your own Third Room client.

If you also want to self-host a Matrix homeserver, please refer to the [Synapse documentation](https://matrix-org.github.io/synapse/develop/welcome_and_overview.html).

::: tip
Third Room uses Matrix's Group VoIP Calls feature to enable networking and voice chat in virtual worlds.
In order for WebRTC calls to connect in all networking scenarios, you should set up a TURN server such as Coturn. You can find more information on configuring Coturn in Synapse [here](https://matrix-org.github.io/synapse/develop/turn-howto.html).
:::

## Prerequisites

To build the Third Room client you'll need [Node](https://nodejs.org) (version 16+) and [yarn](https://classic.yarnpkg.com) (v1) installed on your system.

You'll also need to clone the Third Room repository:

```bash
git clone https://github.com/matrix-org/thirdroom.git
```

## Building the Client

First ensure that you are in the thirdroom root directory

```back
cd thirdroom
```

Then install the dependencies:

```bash
yarn
```

Then build the client:

```bash
yarn build
```

::: tip
In some environments we've seen the build step allocate too much memory and fail. If you run into this issue, you can try increasing the memory limit for Node:

```bash
NODE_OPTIONS=--max_old_space_size=4096 yarn build
```

:::

The built client will be available in the `dist` directory.

## Hosting the Client

You can use any static web server to host the client. We recommend using [Caddy](https://caddyserver.com) as it's easy to configure and supports HTTPS out of the box. [Nginx](https://nginx.org) is another popular option.

### Caddy

To host the client with Caddy, first install Caddy on your system. You can find instructions for your platform [here](https://caddyserver.com/docs/install).

Then create a Caddyfile with the following content, make sure to change the root path to the path of the `dist` directory you built earlier:

```caddyfile
localhost:3000 {
  encode gzip

  handle {
    root * ./path/to/dist
    try_files {path} {path}/index.html /index.html
    file_server
    header Cross-Origin-Opener-Policy "same-origin"
    header Cross-Origin-Embedder-Policy "require-corp"
  }
}
```

Then run Caddy in the same directory as your Caddyfile:

```bash
caddy run
```

You should now be able to access the client at `http://localhost:3000`.

You can change `localhost:3000` to whatever domain you're hosting the client on.

## Required Headers

Third Room requires the following headers to be set in order to function correctly:

```http
Cross-Origin-Opener-Policy "same-origin"
Cross-Origin-Embedder-Policy "require-corp"
```

If your homeserver is hosted on the same domain as your client you also must ensure that the `./well-known` directory is served properly so that the client can discover the homeserver configuration.

## Additional Configuration

Configuration options can be found in the `/config.json` file. You can change the default homeserver displayed on the login page, the homeservers shown in the dropdown, the OpenID Connect provider configuration, and more there. This file should be modified before the client is built.

If you're hosting your own homeserver on the same domain as the client, you'll also want to adjust the files in the `./well-known` directory to point to your homeserver.

Other client modifications and configuration are up to you. We've left them undocumented for now and encourage you to explore the codebase to see what's possible. However, if you're looking to extensively modify the client's runtime behavior, we suggest you look to see if it's possible with the existing WebSG APIs first. For content to be interoperable across clients, it's important that we all use the same APIs and protocols. If you're interested in getting involved in shaping the future of the glTF or WebSG standards please get in touch with us on [Matrix](https://matrix.to/#/#thirdroom-dev:matrix.org).
