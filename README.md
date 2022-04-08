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

A browser-based immersive web client

- Federated infrastructure built on the [Matrix](https://matrix.org/) protocol
- Peer to Peer WebRTC Voice and Datachannels
- Tuned for performance with [bitECS](https://github.com/NateTheGreatt/bitecs) and [Three.js](https://threejs.org/)
- [Rapier.js](https://rapier.rs/) WASM based physics engine
- Implements the [Open Metaverse Interoperability group](https://omigroup.org)'s standards for glTF extensions

[Learn more about Third Room and our roadmap here](https://github.com/matrix-org/thirdroom/discussions/20)

## Local Development

After you've installed node.js locally, run the following commands.

```
npm install -g yarn
yarn
yarn dev
```

**NOTE: Vite does not transpile import statements in web workers and Chromium based browsers are the only browsers to support imports in Web Workers. In order to develop in non-chromium browsers, run the following command which will build the project after every change.**

```
yarn preview
```

Open http://localhost:3000

## Customizing your client

Guide coming soon! We're still working on the API. Feel free to modify your own client and submit a PR with your improvements!
