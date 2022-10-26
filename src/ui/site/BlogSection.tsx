import { Text } from "../atoms/text/Text";
import "./BlogSection.css";

function BlogImage({
  imgSrc,
  imgAlt,
  align = "right",
}: {
  imgSrc: string;
  imgAlt: string;
  align?: "right" | "left" | "center";
}) {
  return <img className={`BlogImage BlogImage--${align}`} src={imgSrc} alt={imgAlt} />;
}

export function BlogSection() {
  return (
    <section className="BlogSection flex flex-column items-center gap-xl">
      <div className="BlogSection__content">
        <Text variant="h1" weight="bold">
          Welcome to Third Room: Technology Preview
        </Text>
        <Text variant="s1" weight="semi-bold">
          Introducing an open, standards-based, decentralised vision of the metaverse for the open Web, built entirely
          on <a href="https://matrix.org">Matrix</a>… without cryptocurrencies, NFTs or walled gardens.
        </Text>
        <Text variant="c1">Hi all,</Text>
        <Text variant="c1">
          <a href="https://matrix.org">Matrix</a> has always been about more than just chat, and we are incredibly
          excited today to finally publicly debut our first Technology Preview of Third Room - a beautiful new web
          client for connecting to shared 3D (or 2D) spatial environments and applications built on Matrix.
        </Text>
        <Text variant="c1">
          Third Room lets you use Matrix as the platform for a truly free and open decentralised vision of the metaverse
          (or however you refer to interoperable virtual worlds and spatial web applications) - built entirely on open
          standards via liberally licensed open source implementations, and without any dependencies on
          cryptocurrencies, NFTs, or data-hoarding big tech silos. In other words: Third Room will be a blank canvas for
          you to build open metaverse environments and applications in the spirit of the original open Web.
        </Text>

        <ul>
          <li>
            <a href="#the-vision">The vision</a>
          </li>
          <li>
            <a href="#how-do-you-use-it">How do you use it?</a>
          </li>
          <li>
            <a href="#how-does-it-work">How does it work?</a>
          </li>
          <li>
            <a href="#whats-left">What's left to do?</a>
          </li>
          <li>
            <a href="#what-makes-us-unique">What makes Third Room unique?</a>
          </li>
          <li>
            <a href="#built-on-matrix">Built entirely on Matrix</a>
          </li>
          <li>
            <a href="#what-can-you-use-it-for">What could you use it for?</a>
          </li>
          <li>
            <a href="#how-does-this-fit-in">How does this fit in with the rest of Matrix?</a>
          </li>
          <li>
            <a href="#next-steps">Next steps</a>
          </li>
        </ul>

        <BlogImage align="center" imgSrc="/landing/Multiplayer.jpg" imgAlt="image" />

        <Text id="the-vision" variant="h2" weight="semi-bold">
          The vision
        </Text>
        <Text variant="c1">
          We see Third Room as a logical extension to today’s Matrix clients. The starting point for a Matrix room is of
          course simple text chat across a decentralised set of users. From there, it’s an obvious extension to add more
          sophisticated collaboration features such as the ability to send files, share locations, send voice messages,
          embed widgets, etc. The next level up from that is to add voip calling, to upgrade rooms into voice and{" "}
          <a
            href="https://twitter.com/matrixdotorg/status/1566063359996428289"
            target="_blank"
            rel="noreferrer noopener"
          >
            video rooms
          </a>{" "}
          for end-to-end encrypted (E2EE) conferencing. So what if you wanted to go further: to upgrade the room to
          interact together in any way imaginable, building on a blank canvas for open spatial collaboration - pulling
          in people, apps, digital assets and bridged content in order to mix together whatever realtime collaborative
          semantics you want… much like the Web itself lets you go wild with HTML+JS+CSS to build your own webapps? This
          is our goal with Third Room.
        </Text>

        <Text id="how-do-you-use-it" variant="h2" weight="semi-bold">
          How do you use it?
        </Text>
        <Text variant="c1">
          The point of today’s tech preview is to show off the capabilities of Third Room’s engine and spark interest
          from the community in contributing to the project, rather than it being a mainstream-usable app. In
          particular, we don’t yet have persistence, custom avatars, or custom games/experiences hooked up yet. That
          said, there’s obviously some stuff already here for you to play with! To get going, head over to{" "}
          <a href="https://thirdroom.io">https://thirdroom.io</a> in a modern desktop browser and log in as a guest or
          registered user. In the tech preview, each user gets their own lobby room to familiarise themselves with the
          engine - which contains links (portals) to other rooms where you can go find other people to hang out with.
          Hit the <kbd>/</kbd> key to pull up the keyboard shortcuts you can use to navigate and interact with the
          world. You can also create your own private rooms, either picking existing glTF assets to define the scene, or
          uploading your own glTF. To create your own glTF assets, go wild in Blender, or come ask in{" "}
          <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" target="_blank" rel="noreferrer noopener">
            #thirdroom-dev:matrix.org
          </a>{" "}
          about how to use our Unity asset export pipeline.
        </Text>

        <BlogImage align="center" imgSrc="/landing/Engine.jpg" imgAlt="image" />

        <Text id="how-does-it-work" variant="h2" weight="semi-bold">
          How does it work?
        </Text>
        <Text variant="c1">
          Third Room is built on a new browser-based engine that we’ve built called{" "}
          <a
            href="https://github.com/matrix-org/thirdroom/tree/main/src/engine"
            target="_blank"
            rel="noreferrer noopener"
          >
            Manifold
          </a>
          , which links together{" "}
          <a href="https://threejs.org/" target="_blank" rel="noreferrer noopener">
            Three.js
          </a>
          ,{" "}
          <a href="https://github.com/NateTheGreatt/bitECS" target="_blank" rel="noreferrer noopener">
            bitECS
          </a>
          ,{" "}
          <a href="https://rapier.rs/" target="_blank" rel="noreferrer noopener">
            Rapier
          </a>{" "}
          to provide a super high-performance multi-threaded game engine for the Web - which is then hooked into Matrix
          via{" "}
          <a href="https://www.npmjs.com/package/hydrogen-view-sdk" target="_blank" rel="noreferrer noopener">
            Hydrogen SDK
          </a>{" "}
          in order to provide the Matrix networking and chat/voip components, with the rest of the UI built in React.
        </Text>
        <Text variant="c1">
          Manifold achieves a stable 60fps on a typical modern laptop - on Chrome on a M1 Macbook Pro, it renders a
          typical scene at 2000x1244px at 60fps, with 13.12ms of unused gametime available for every 16.67ms frame, and
          in Safari 16 it can manage fullscreen 3440x1440px at an easy 60fps(!). It gets this crazy performance by
          extensive use of lock-free data structures built with SharedArrayBuffers and Atomics - producing a proper
          multi-threaded, multi-core capable Web-based game engine.
        </Text>
        <Text variant="c1">In practice, we currently have three threads:</Text>
        <ol className="BlogSection__spaced-list">
          <li>
            The Main JS thread, which handles the React UI, Audio, WebRTC and Matrix via Hydrogen (although we could run
            Hydrogen on a worker if we wanted, but it’s so light it hasn’t necessitated it).
          </li>
          <li>
            The Render thread, which renders the visuals of the world using Three.js’s WebGLRenderer to an
            OffscreenCanvas, and also handles resource loading (although this could be workerised too). Firefox just
            landed{" "}
            <a
              href="https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas"
              target="_blank"
              rel="noreferrer noopener"
            >
              OffscreenCanvas
            </a>{" "}
            in FF 105, and Chrome already had it: for Safari and browsers without OffscreenCanvas we render on the main
            thread instead.
          </li>
          <li>
            The Game thread, which runs the Rapier physics engine in WASM, actually executes gameplay logic, and passes
            renderable state into the Render thead.
          </li>
        </ol>
        <Text variant="c1">
          The threads communicate together with a mix of PostMessage and a triple-buffer of SharedArrayBuffers, which
          use Atomics to track which buffer the Game thread should be writing into; which buffer the Render thread
          should be reading from; and which buffer should be written into next. This lets the game engine tick at a
          solid 60fps, while the render thread will run at whatever crazy refresh rate your display has.
        </Text>
        <Text variant="c1">
          The final piece of the puzzle is{" "}
          <a href="https://github.com/NateTheGreatt/bitECS" target="_blank" rel="noreferrer noopener">
            bitECS
          </a>{" "}
          - an ultra-high performance Entity Component System library written by our very own Nate, which stores the
          state of all the entities in the world in JavaScript TypedArrays, maintaining a cache-efficient packed data
          structure accessed by all the most performance critical operations in the engine - effectively enabling
          WASM-style speeds without having to resort to WASM.
        </Text>
        <Text variant="c1">
          You can read more about the engine architecture{" "}
          <a
            href="https://github.com/matrix-org/thirdroom/blob/main/docs/engine-architecture.md"
            target="_blank"
            rel="noreferrer noopener"
          >
            in the docs
          </a>
          , or in{" "}
          <a
            href="https://github.com/matrix-org/thirdroom/discussions/47#discussion-4033099"
            target="_blank"
            rel="noreferrer noopener"
          >
            this update
          </a>{" "}
          from April.
        </Text>
        <Text variant="c1">In terms of features, Third Room Technology Preview 1 provides support for:</Text>
        <ul>
          <li>glTF asset loading from the Matrix media repository</li>
          <li>
            Engine’s internal scene graph maps 1-to-1 with glTF concepts providing a stable API to build on for UGC and
            future realtime document editing
          </li>
          <li>mixamo-backed avatar animation</li>
          <li>Physics simulation via Rapier</li>
          <li>Decentralised WebRTC networking via Matrix data channels (full mesh)</li>
          <li>Network data smoothing using linear (and in future cubic hermite) interpolation</li>
          <li>Decentralised chat via Matrix and Hydrogen SDK</li>
          <li>Spatial WebRTC audio via Matrix</li>
          <li>End-to-end encrypted networking via Matrix</li>
          <li>Basic moderation features (name tags, mute, ignore, kick etc)</li>
          <li>Unity Export via UnityGLTF</li>
          <ul>
            <li>Skybox (MX_background)</li>
            <li>Lightmaps (MX_lightmap)</li>
            <li>Reflection probes (MX_reflection_probes)</li>
            <li>Spatial Audio (KHR_audio)</li>
            <li>Physics Colliders (OMI_collider)</li>
            <li>Spawn Points (MX_spawn_point)</li>
          </ul>
          <li>Drag and drop in-browser asset optimization pipeline via glTF-transform</li>
          <ul>
            <li>Resize large textures</li>
            <li>Remove unused nodes</li>
            <li>Basis Universal Compressed texture support (KHR_texture_basisu) </li>
            <li>Instanced mesh support (EXT_mesh_gpu_instancing)</li>
          </ul>
          <li>Postprocessing pipeline (currently bloom and tonemapping)</li>
          <li>
            built-in super-speedy glTF previewer (drop and drag your .glb onto{" "}
            <a href="https://thirdroom.io/viewer">https://thirdroom.io/viewer</a>)
          </li>
          <li>Three.js Improvements</li>
          <ul>
            <li>Bulk of 3D transformation work moved to game thread</li>
            <li>Scene traversal and world matrix updates use efficient bitECS data structures</li>
            <li>Shared HDR lightmaps across multiple objects including instanced meshes</li>
            <li>Blended HDR reflection probes using texture arrays with instanced mesh support</li>
          </ul>
          <li>
            3D Tiles support (via NASA’s{" "}
            <a href="https://github.com/NASA-AMMOS/3DTilesRendererJS" target="_blank" rel="noreferrer noopener">
              3DTilesRenderer
            </a>
            ) for incrementally streaming environments à la Google Earth
          </li>
          <li>OpenID Connect for login, registration, guest access, account management.</li>
        </ul>

        <Text id="whats-left" variant="h2" weight="semi-bold">
          What's left to do?
        </Text>

        <Text variant="c1">
          We’re releasing the technology preview today to show what the engine is capable of right now, and to hopefully
          spark interest from the community in contributing to the project (especially for technical artists!). But
          there’s lots of stuff left to do:
        </Text>
        <ul className="BlogSection__spaced-list">
          <li>
            <span className="semi-bold">Custom Avatars:</span> At the moment, everyone is shown as a mixamo Y-bot. We'll
            be adding in the ability to set your own rigged avatar asap, needless to say!
          </li>

          <li>
            <span className="semi-bold">User Generated Content:</span> The vision is of course for Third Room to be a
            canvas on which anyone can script their own functionality, just like folks can write Matrix bots, bridges
            and widgets today. However, we haven’t hooked up the APIs yet to let users write their own apps: these will
            likely be sandboxed WASM executables which run in their own thread. Instead, we’re currently limited to the
            functionality hardcoded into the client (move, run, jump, spawn, pickup, throw, etc).
          </li>

          <li>
            <span className="semi-bold">Editing:</span> We have started on a direct-manipulation editor, letting you go
            full Inception or Dark City and get hands on with changing the world; you can trigger it with the <kbd>§</kbd> or <kbd>`</kbd>
            key. Right now it just lets you navigate the scene graph of the world and select the entities, but the next
            step will be to turn it into a full in-world editor.{" "}
          </li>

          <li>
            <span className="semi-bold">Persistence:</span> We don’t yet save world state back into Matrix: when a user
            disconnects, their state and the objects they own disappears from the world. Instead, we should be storing
            glTF blobs into the Matrix room (as plain old files, so that boring old Matrix bots or non-Third-Room
            clients can also manipulate them!) to track the edits to the world, including persisting what the users have
            got up to within it.
          </li>

          <li>
            <span className="semi-bold">VR/AR:</span> We need to flip the bit to enable WebVR / WebXR support (and then
            tweak the app’s UI to be usable in a 3D environment)
          </li>

          <li>
            <span className="semi-bold">Mobile Web support:</span> Similarly, we need to tweak the CSS and UI to support
            mobile Web. Ironically the engine itself performs excellently on smartphones!
          </li>

          <li>
            <span className="semi-bold">SFU VoIP:</span> Currently the WebRTC networking for VoIP and data channels
            operates as full mesh - meaning that each participant has to redundantly send the same traffic to every
            other participant. As a result, after 10-20 users, things can start to bog down. We’re{" "}
            <a
              href="https://twitter.com/matrixdotorg/status/1555620039323275264"
              target="_blank"
              rel="noreferrer noopener"
            >
              busy working
            </a>{" "}
            on a Selective Forwarding Unit for Matrix to help this scale to hundreds/thousands of users, but it’s not
            landed yet (and once we’ve got it working in Element Call, we’ll have to port it over to Hydrogen for Third
            Room to use).
          </li>

          <li>
            <span className="semi-bold">Engine features:</span> Realtime shadows (which need to play nice with the baked
            lightmaps; experiment underway), smarter antialiasing
            (e.g. Temporal Reprojection Anti Aliasing,{" "}
            <a href="https://github.com/mrdoob/three.js/issues/14050" target="_blank" rel="noreferrer noopener">
              if/when it lands
            </a>{" "}
            in Three.js), depth-of-field, animated assets, etc. etc.
          </li>
        </ul>

        <BlogImage align="center" imgSrc="/landing/Portal.jpg" imgAlt="image" />

        <Text id="what-makes-us-unique" variant="h2" weight="semi-bold">
          What makes Third Room unique?
        </Text>
        <Text variant="c1">
          There’s obviously been way too much hype about virtual worlds and the metaverse recently, so it’s important to
          spell out what makes Third Room unique.
        </Text>

        <ul className="BlogSection__spaced-list">
          <li>
            <span className="semi-bold">Web first.</span> Third Room aspires to be the real-time spatial layer of the
            open Web, and as such our primary target platform is of course the Web, building on the incredible advances
            in WebGL, WebRTC, WebXR, WebWorkers and WebGPU in recent years. The Web is finally at the point where it’s
            possible to build a game engine whose performance rivals native applications - and so while many roads into
            the metaverse seem to involve installing enormous proprietary Windows-only native apps via Steam, Third Room
            is available to anyone with a web browser. We’ve tested on Chrome, Firefox and Safari, but it should work on
            any modern up-to-date browser… including on older machines: after all, the Web is for everyone. For
            instance, Third Room runs fine on a 2010 Macbook Air with integrated graphics. Today’s release is desktop
            web only, but mobile web is not far away (and performance is great!). Obviously there’s nothing stopping
            people from also building Third Room compatible native clients too (same as for normal Matrix) - and we hope
            to see Godot, Unity and Unreal clients emerge in due course! But our roots will always be on the open Web.
          </li>
          <li>
            <span className="semi-bold">Open standards throughout.</span> Building on Matrix means that Third Room
            already inherits from Matrix’s{" "}
            <a href="https://spec.matrix.org/" target="_blank" rel="noreferrer noopener">
              open standard
            </a>{" "}
            and{" "}
            <a href="https://spec.matrix.org/proposals/" target="_blank" rel="noreferrer noopener">
              open governance model
            </a>
            . However, to actually describe and model the 3D assets in Third Room, we are using{" "}
            <a href="https://www.khronos.org/gltf/" target="_blank" rel="noreferrer noopener">
              glTF
            </a>{" "}
            throughout - the official royalty-free open standard 3D asset format standardised by{" "}
            <a href="https://www.khronos.org/" target="_blank" rel="noreferrer noopener">
              The Khronos Group
            </a>
            . Similarly we are building on{" "}
            <a href="https://www.khronos.org/webgl" target="_blank" rel="noreferrer noopener">
              WebGL
            </a>{" "}
            and (potentially in future){" "}
            <a href="https://github.com/KhronosGroup/glXF" target="_blank" rel="noreferrer noopener">
              glXF
            </a>
            , also in the aegis of The Khronos Group, as well as recent W3C standards like WebRTC, WebXR,
            SharedArrayBuffers, Atomics, OffscreenCanvas, WebWorkers and the rest of the modern web stack. For avatars
            we’re looking at{" "}
            <a href="https://vrm.dev" target="_blank" rel="noreferrer noopener">
              VRM
            </a>
            , and for streaming 3D environments we’re using{" "}
            <a href="https://github.com/CesiumGS/3d-tiles" target="_blank" rel="noreferrer noopener">
              3D Tiles
            </a>
            .
            <br />
            Now, the interesting bit is where we hit the edge of the existing standards - for instance, defining how to
            embed glTF into Matrix rooms, or how to extend glTF to describe spatial audio assets. We already have a
            basic Matrix Spec Change (
            <a
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/3815"
              target="_blank"
              rel="noreferrer noopener"
            >
              MSC3815
            </a>
            ) to define how to describe a 3D worlds in a Matrix room, and we’ll specify the actual world-synchronisation
            network protocol (which runs over{" "}
            <a
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/3401"
              target="_blank"
              rel="noreferrer noopener"
            >
              MSC3401
            </a>
            -negotiated data channels) as an MSC once it’s stabilised (you can see an early draft{" "}
            <a
              href="https://github.com/matrix-org/thirdroom/blob/main/docs/network-protocol.md"
              target="_blank"
              rel="noreferrer noopener"
            >
              here
            </a>
            ). The expectation is that all these “Metaverse over Matrix” MSCs will end up being a separate annex to the
            Matrix spec, looked after by an domain-specific Matrix spec working group rather than the normal Matrix spec
            core team (and so avoid bloating the core Matrix spec with metaverse-specific stuff).
            <br />
            Meanwhile, while building Third Room we’ve found ourselves repeatedly hitting the edge of the possible in
            glTF itself - but luckily, much as Matrix has MSCs, glTF has Extensions to let folks experiment with new
            functionality… and we’re proud to announce that the Matrix.org Foundation has formally joined The Khronos
            Group as a non-profit participant in order to formally participate in the spec process for glTF, WebGL,
            OpenXR etc and contribute our extensions into the official spec. We are also participating in the{" "}
            <a href="http://metaverse-standards.org" target="_blank" rel="noreferrer noopener">
              Metaverse Standards Forum
            </a>
            , as well as being highly active in the{" "}
            <a href="https://omigroup.org/" target="_blank" rel="noreferrer noopener">
              Open Metaverse Interoperability Group
            </a>
            .
          </li>
          <li>
            <span className="semi-bold">Open Source.</span> It should be no surprise that Third Room is entirely{" "}
            <a href="https://github.com/matrix-org/thirdroom" target="_blank" rel="noreferrer noopener">
              open source
            </a>
            , licensed under the permissive Apache 2.0 Software Licence just like the rest of Matrix’s reference
            implementations. The reason is that we believe that foundational software should be as liberally licensed as
            possible in order for it to have the highest chance of success - we want this to be something everyone can
            contribute to, and everyone can build on for free (both commercially and non-commercially). We do not
            require contributors to sign away their IP with a CLA; contributors retain ownership of their IP and share
            the copyright of the project with each other, protecting the project from relicensing shenanigans and
            cementing it as a foundation that everyone can build on. Finally, Third Room is proud to build on a set of
            amazing open source dependencies - most notably{" "}
            <a href="https://threejs.org/" target="_blank" rel="noreferrer noopener">
              Three.js
            </a>{" "}
            to abstract WebGL,{" "}
            <a href="https://github.com/NateTheGreatt/bitECS" target="_blank" rel="noreferrer noopener">
              bitECS
            </a>{" "}
            to track the world’s state,{" "}
            <a href="https://rapier.rs/" target="_blank" rel="noreferrer noopener">
              Rapier
            </a>{" "}
            as a physics engine,{" "}
            <a href="https://www.npmjs.com/package/hydrogen-view-sdk" target="_blank" rel="noreferrer noopener">
              Hydrogen SDK
            </a>{" "}
            to power the Matrix layer, and a little bit of React to glue it all together. We hope that people will build
            amazing things on top of Third Room in turn!
          </li>
          <li>
            <span className="semi-bold">Free, open and equitable.</span> We profoundly believe that the metaverse should
            be free - both free as in beer, and free as in speech. Just like the Web, you shouldn’t have to pay to
            participate, and it should be open to everyone, without walled gardens or silos, and you should certainly
            not have to pay for it with your data or metadata. We want to provide a truly equitable environment where
            everyone is equal to create their own content and participate without intrinsic privilege or inequality. As
            a result, there is no artificial scarcity in Third Room, or virtual real-estate speculation, or intrinsic
            currencies: just like Matrix, everyone is free to participate on a level pegging, and there are no financial
            incentives baked into the system. Of course, folks are welcome to sell or trade content, avatars, assets,
            apps - just like on the Web - and there’s nothing stopping you from using cryptocurrencies either. But the
            platform itself will never have financial incentives or primitives baked in.
          </li>
          <li>
            <span className="semi-bold">Aesthetically beautiful.</span> We’re determined that Third Room’s engine should
            be as visually sophisticated and aesthetically beautiful as possible, and that we should seed the ecosystem
            with beautiful high-quality artwork and assets. The latter has been a bit tricky as we don’t have any
            artists contributing to the project yet, but we’ve done our best by repurposing Unity assets from{" "}
            <a
              href="https://assetstore.unity.com/packages/3d/environments/sci-fi/3d-scifi-kit-vol-3-121447"
              target="_blank"
              rel="noreferrer noopener"
            >
              Creepy Cat
            </a>{" "}
            and{" "}
            <a
              href="https://assetstore.unity.com/packages/3d/environments/urban/city-builder-london-214943?aid=1101lMAW&utm_source=aff"
              target="_blank"
              rel="noreferrer noopener"
            >
              ReversedInt
            </a>{" "}
            to get the ball rolling. Meanwhile, if you are a 3D artist who’s interested in what we’re doing here -{" "}
            <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" target="_blank" rel="noreferrer noopener">
              please get in touch
            </a>
            !
          </li>
          <li>
            <span className="semi-bold">Pancake first.</span> The reality is that VR/AR headsets have not yet taken over
            the world, and the vast majority of mainstream users are still on boring old flat 2D “pancake” laptop and
            smartphone screens, and we want Third Room to be amazing for the mainstream audience. As a result, our
            primary platform for Third Room is unashamedly the plain old web browser as viewed on a flat screen -
            although we will of course be adding VR/AR support via WebXR in future.
          </li>
        </ul>

        <BlogImage align="center" imgSrc="/landing/UI.jpg" imgAlt="image" />

        <Text id="built-on-matrix" variant="h2" weight="semi-bold">
          Built entirely on Matrix
        </Text>
        <Text variant="c1">
          It’s worth reiterating that Third Room does not have its own server - it is powered exclusively by plain old
          Matrix homeservers, with no new APIs or functionality required whatsoever. As a result, anyone running their
          own Synapse, Dendrite, Conduit or Construct can go and point Third Room at it and jump straight in. In return,
          Third Room inherits a tonne of amazing features directly from Matrix:
        </Text>

        <ul className="BlogSection__spaced-list">
          <li>
            <span className="semi-bold">Decentralised:</span> rooms are replicated across the participating servers,
            with no single point of failure or control. So you get decentralised access control and network partition
            tolerance for free: there is no single server owning or controlling the virtual world; it is impossible to
            connect to someone else on a different server without sharing ownership bilaterally with them.
            <br />
            The one exception to this in Third Room is the physics engine: currently, objects are ‘owned’ by the account
            which created them, which then runs the physics simulation for that object and then pushes the results out
            to the other users in the room to update their world view. We are not yet running a decentralised physics
            simulation, sadly :) We have plans to improve this in future however.
          </li>
          <li>
            <span className="semi-bold">VoIP:</span> Third Room uses{" "}
            <a
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/3401"
              target="_blank"
              rel="noreferrer noopener"
            >
              MSC3401
            </a>{" "}
            both to provide spatial audio throughout the world, and also to provide the WebRTC data channels which are
            used for low latency networking to synchronise world state between the participants in the room (using{" "}
            <a href="https://github.com/vector-im/hydrogen-web/pull/705" target="_blank" rel="noreferrer noopener">
              Hydrogen SDK’s implementation
            </a>{" "}
            of MSC3401). Currently it’s using full-mesh peer-to-peer between the various participating clients for
            connectivity, meaning a limit of tens of users per room, but as soon as the{" "}
            <a href="https://github.com/matrix-org/waterfall" target="_blank" rel="noreferrer noopener">
              SFU
            </a>{" "}
            is stable we’ll be able to support hundreds/thousands of users per room. It’s been incredibly rewarding to
            see the native Matrix calling as pioneered by{" "}
            <a
              href="https://element.io/blog/element-call-beta-2-encryption-spatial-audio-walkie-talkie-mode-and-more/"
              target="_blank"
              rel="noreferrer noopener"
            >
              Element Call
            </a>{" "}
            coming into its own to power Third Room.
          </li>
          <li>
            <span className="semi-bold">E2EE:</span> Third Room is the only end-to-end encrypted metaverse client in
            existence, as far as we know.
          </li>
          <li>
            <span className="semi-bold">Authentication:</span> Matrix is moving to natively use OpenID Connect for
            authentication, and Third Room is the world’s first ever OIDC-native Matrix app. It implements{" "}
            <a
              href="https://github.com/matrix-org/matrix-spec-proposals/blob/hughns/delegated-oidc-architecture/proposals/3861-delegated-oidc-architecture.md"
              target="_blank"
              rel="noreferrer noopener"
            >
              MSC3861
            </a>{" "}
            in order to delegate all guest access, account registration, login, reCAPTCHA, 2FA, session management etc.
            to your identity provider. For the thirdroom.io server, we’ve set up a Third Room branded Keycloak instance
            as the identity provider - but in future it will also support the lightweight Matrix Authentication Service
            identity provider that we’re working on. It’s been incredibly impressive to see how OIDC has accelerated
            Third Room’s development, and a huge relief to know that in future we will never have to implement our own
            auth flows ever again - either in clients or servers!
          </li>
          <li>
            <span className="semi-bold">Moderation:</span> Last but not least, we inherit all the work going on to
            improve moderation in Matrix - particularly important in a richer virtual environment with the associated
            risk of toxic content. We’re launching with basic moderation features like ‘kick’, ‘ban’, ‘ignore’ and
            ‘mute’ - and as the more sophisticated moderation tooling lands we’ll automatically inherit too.
          </li>
        </ul>

        <Text id="what-can-you-use-it-for" variant="h2" weight="semi-bold">
          What could you use it for?
        </Text>
        <Text variant="c1">The sort of use cases we’re considering here are:</Text>
        <ul>
          <li>Virtual events - imagine if FOSDEM was hybridised between real-ULB and virtual-ULB?!</li>
          <li>Telepresence - what is the ultimate way for someone remote to attend an in-person meeting?</li>
          <li>Virtual socialising - simply hang out with your friends online in a 3D environment</li>
          <li>Music - jam on a virtual Bosendorfer, or warble on a virtual theremin…</li>
          <li>Art and Design - get building 3D or 2D models and artwork directly in Third Room!</li>
          <li>Gaming - the entire spectrum of multiplayer gaming could exist in Third Room</li>
          <li>
            Entertainment - make that awesome indie VR movie on an open platform rather than in a proprietary silo
          </li>
          <li>Online relationships - have a sanctuary just for you</li>
          <li>
            Disaster management - visualise earthquake zones through realtime streams of LIDAR data from drones;
            coordinate and visualise all the disparate emergency services which need to work together...
          </li>
          <li>GIS applications - e.g. search & rescue operations, geophysics, flood simulation</li>
          <li>Smart cities - e.g. visualise town planning, power utilisation, pollution and congestion levels</li>
          <li>Healthcare - remote surgery, MRI visualisation, body analytics, epidemic visualisation…</li>
          <li>Education - learn chemistry in the world’s best virtual science lab!</li>
          <li>Programming - nothing says object orientation like plugging objects together like lego!</li>
          <li>Engineering - look inside that nuclear reactor or jet engine and figure out what part to fix?</li>
          <li>Simulated environments - visit ancient Egypt... or simply build The Matrix</li>
          <li>Meteorology - see how cumulo stacks will form...</li>
          <li>Transport - ...and how best to fly through them</li>
          <li>Climatology - visualise the impact of global warming (and stop it)?</li>
          <li>Agriculture - visualise the health of my crops?</li>
          <li>
            Eventually, 2D or document collaboration a la Figma or Etherpad - which is after all a subset of 3D if you
            squint hard enough.
          </li>
        </ul>
        <Text variant="c1">
          …but frankly, the canvas is infinite, much like the Web itself. The goal is literally for any real-time
          interactive spatial application to be able to exist in Third Room - building directly on Matrix’s existing
          open standard APIs for end-to-end encryption, decentralised conversations, authentication and even P2P (
          <a href="https://arewep2pyet.com" target="_blank" rel="noreferrer noopener">
            when ready
          </a>
          ). You can compare this with the{" "}
          <a href="https://github.com/matrix-org/thirdroom/discussions/20" target="_blank" rel="noreferrer noopener">
            original vision
          </a>{" "}
          of the project at kick-off back in February to see how things have evolved!
        </Text>

        <Text id="how-does-this-fit-in" variant="h2" weight="semi-bold">
          How does this fit in with the rest of Matrix?
        </Text>
        <Text variant="c1">
          Whenever we work on metaverse or VR for Matrix (e.g.{" "}
          <a
            href="https://matrix.org/blog/2018/02/05/3-d-video-calling-with-matrix-webrtc-and-webvr-at-fosdem-2018"
            target="_blank"
            rel="noreferrer noopener"
          >
            3D video calling
          </a>
          , or our{" "}
          <a
            href="https://matrix.org/blog/2017/04/04/opening-up-cyberspace-with-matrix-and-webvr"
            target="_blank"
            rel="noreferrer noopener"
          >
            original Matrix + WebVR demo
          </a>
          ) we always get a some grumpy feedback along the lines of “why are you wasting time doing VR when Element
          still doesn’t have multi-account?!” or whatever your favourite pet Matrix or Element deficiency is.
        </Text>
        <Text variant="c1">
          The fact is that Third Room has been put together by a tiny team of just Robert (project lead, formerly of
          Mozilla Hubs & AltspaceVR), Nate (of bitECS fame) and Ajay (of Cinny fame) - with a bit of input from Rian and
          Jordan (Design), Bruno (Hydrogen) and Hugh (OIDC). On the Matrix side it’s been absolutely invaluable in
          driving Hydrogen SDK (which also powers things like{" "}
          <a href="https://element.io/blog/element-launches-chatterbox/" target="_blank" rel="noreferrer noopener">
            Chatterbox
          </a>{" "}
          and of course Hydrogen itself) - as well as helping drive native Matrix VoIP and MSC3401 implementation work,
          and critically being our poster-child guinea pig experiment for the first ever native OpenID Connect Matrix
          client! In terms of “why do this rather than improve Element” - the domain-specific expertise at play here
          simply isn’t that applicable to mainstream Element - instead there are tonnes of other people focused on
          improving Matrix (and Element). For instance we shipped a{" "}
          <a
            href="https://element.io/blog/an-unrecognisable-improvement-elements-new-design-is-here/"
            target="_blank"
            rel="noreferrer noopener"
          >
            massive update
          </a>{" "}
          to Element’s UI the other week.
        </Text>
        <Text variant="c1">
          Also, it’s worth noting that at Element we’ve been showing off Third Room as it develops to a lot of our big
          customers - and in practice there is significant interest from many of our big public sector deployments to
          experiment with Third Room. We are depending on commercial interest to scale up work on Third Room - please
          get in touch if you’re interested in funding. Revisiting the list of use cases above should give you an idea
          of the range of applications that folks have in mind, and we hope that this will be an impetus to grow the
          project and see where it goes!
        </Text>

        <Text id="next-steps" variant="h2" weight="semi-bold">
          Next steps
        </Text>
        <Text variant="c1">
          Our next main milestone is to release a minimum viable product (MVP) version of Third Room which a mainstream
          audience can use, rather than the technology preview/showcase we’ve released today to developers. In practice,
          this primarily means sorting out persistence, editing, and UGC so that we (and the community!) can start
          creating proper applications on top of the engine. We’re aiming to release the MVP towards the end of the
          year, but meanwhile we’ll continuously deploying thirdroom.io off the main branch of the repository.
        </Text>
        <Text variant="c1">
          It might also be interesting to see whether Third Room can embed in Element using the same{" "}
          <a
            href="https://matrix.org/blog/2022/08/15/the-matrix-summer-special-2022#matryoshka-voip-embedding"
            target="_blank"
            rel="noreferrer noopener"
          >
            Matryoshka embedding
          </a>{" "}
          trick which is working so well with Element Call - after all; if you’re already in Matrix in Element (or some
          other widget-capable Matrix client), why shouldn’t you just be able to reach straight into Third Room? This
          will likely come much later.
        </Text>
        <Text variant="c1">
          Finally: we desperately need 3d generalists, character artists, and environment artists to come work with us
          to help build out beautiful avatars, scenes, assets, and generally ensure that Third Room sets a precedent for
          being beautiful - and to make the most of the engine in general. If Blender is your happy place, please come
          find us in{" "}
          <a href="https://matrix.to/#/#thirdroom-dev:matrix.org" target="_blank" rel="noreferrer noopener">
            #thirdroom-dev:matrix.org
          </a>{" "}
          to find out how to get involved.
        </Text>
        <Text variant="c1">
          We live in exciting times: it will be fascinating to see how Third Room progresses, and whether it really
          could provide a viable alternative to the increasingly closed/centralised or NFT-focused visions of the
          metaverse which is emerging. But whatever happens, we hope you’re excited to finally play with it as we are!
        </Text>
      </div>
    </section>
  );
}
