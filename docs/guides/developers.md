# Third Room for Developers

Third Room is designed to be a flexible and extensible platform for creating and sharing virtual worlds. Using the Web Scene Graph API, anyone can create and share their own virtual worlds and experiences with the language of their choice. The Third Room client is also completely open source, allowing you to self-host your own instance of Third Room and customize it to meet your specific needs. The Third Room web client is also designed to be just one client in a larger ecosystem of interoperable clients for browsing virtual worlds created with glTF and WebSG content.

## Web Scene Graph

WebSG is designed to provide a safe and performant way to manipulate glTF scene graphs from a WebAssembly module. The API can be accessed from any wasm-compatible language, giving you the flexibility to choose the programming language that best suits your needs and expertise.

There is also a custom JavaScript runtime and in-world editor, allowing you to fluidly write and edit scripts in a familiar and friendly language without leaving the Third Room client.

By utilizing the WebSG, you can create advanced and interactive experiences within Third Room that respond to user input, trigger events, and dynamically alter the virtual environment.

[Read more about Web Scene Graph](./websg/)

## Self-Hosting

Third Room can be self-hosted, giving you even more control over the user experience and content distribution. By self-hosting, you can customize the client to meet your specific needs and requirements while still benefiting from the core functionality of Third Room.

Third Room is a single page web app (SPA) and can be hosted on any static web server. You do not need to host your own Matrix homeserver in order to customize or self-host your own Third Room client.

[Read more about self-hosting Third Room](./self-hosting)

If you also want to self-host a Matrix homeserver, please refer to the [Synapse documentation](https://matrix-org.github.io/synapse/develop/welcome_and_overview.html).

::: tip
Third Room uses Matrix's Group VoIP Calls feature to enable networking and voice chat in virtual worlds.
In order for WebRTC calls to connect in all networking scenarios, you should set up a TURN server such as Coturn. You can find more information on configuring Coturn in Synapse [here](https://matrix-org.github.io/synapse/develop/turn-howto.html).
:::

## Contributing

Third Room embraces open-source principles, and we actively encourage contributions from the developer community to help improve the platform and expand its capabilities. If you're interested in contributing to Third Room's open-source repository, follow these steps:

1. Look for open issues or feature requests in the repository's issue tracker. These issues represent opportunities for you to contribute to the project, whether by fixing bugs, implementing new features, or improving documentation.
1. Fork the repository and create a new branch for your changes.
1. Test your changes thoroughly to ensure they don't introduce new bugs or break existing functionality.
1. Submit a pull request to the main repository with your changes, including a detailed description of your contribution and any relevant issue numbers. The Third Room maintainers will review your submission and provide feedback or request changes as necessary.

By contributing to the open-source repository, you can help shape the future of Third Room and enhance the platform for users around the world. Your expertise and dedication are invaluable to the growth and success of the project, and we look forward to collaborating with you.

## Alternate Third Room Clients and WebSG Implementations

We've designed Third Room from the start to be just one client in a larger ecosystem of interoperable clients for browsing virtual worlds created with glTF and WebSG content. We encourage you to create your own Third Room client or WebSG implementation, and we're happy to provide guidance and support to help you get started. If you're interested please reach out to us on [Matrix](https://matrix.to/#/#thirdroom-dev:matrix.org).

## Participation in glTF Standards Groups

We're active members of both the [Khronos 3D Formats Working Group](https://www.khronos.org/gltf/) and the [Open Metaverse Interoperability Group's glTF Working Group](https://github.com/omigroup/gltf-extensions). We're committed to helping shape the future of glTF and we're excited to collaborate with other members of the community to improve the standards and make interoperable virtual worlds better for everyone.

Participation in Khronos requires a membership, but participation in the Open Metaverse Interoperability Group is open to anyone. If you're interested in participating in the glTF Working Group, please join the [OMI Discord](https://discord.com/invite/NJtT9grz5E) and [join us at one of our weekly meetings](https://github.com/omigroup/gltf-extensions#meetings).
