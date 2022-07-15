# Testing Procedure

While Thirdroom is in active development we're lacking integration tests, so we need to do these tests manually. The following checklist should be followed any time you want to push to production.

## Checklist

- [] Did CI pass successfully?
- [] Open the PR's deploy preview
- [] Open the browser's task manager and record initial memory usage for the tab
- [] Complete the following tasks in #uk-city:thirdroom.dev
  - [] Join world
  - [] Move around
  - [] Jump
  - [] Throw cube/balls and look for collision against other meshes
  - [] Pick up and throw cube/ball
  - [] Leave and load next world
- [] Complete the following tasks in #mars:thirdroom.dev
  - [] Join world
  - [] Fly around and look for tiles to progressively load
  - [] Leave and load next world
- [] Complete the following tests in #city:thirdroom.dev
  - [] Join world
  - [] Open second client with another user and join the same room
  - [] Both users avatars should be visible to one another
  - [] Test VoIP (Note: you may need to spawn a cube first, this is a known bug)
  - [] Spawn cubes/balls and check to see that they are visible to the other client
  - [] Send a chat message in the world and observe that it is visible to the other user (Note you must currently press enter to send/receive messages)
  - [] Send a DM to the other user and see that it is visible
  - [] Leave the world on the second client (the newest one that you just opened)
  - [] Observe that the client and all their owned boxes/cubes disappear
  - [] Leave world on the first client
- [] Check client's memory usage in the browser's task manager against initial value. It should be within around ~100mb of the initial value due to resources cached after the initial load.
- [] Create a new world with a test scene
  - [] Load and join world
  - [] Open settings pane and change world name, avatar, scene, and preview thumbnail
  - [] Observe that the scene and all other assets changed successfully
