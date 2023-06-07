# Action Bar

An `Action Bar` is a user interface element that provides various actions the user can perform. It's displayed at the bottom of the screen and labeled with keys 1-9.

## Set items

The `thirdroom.actionBar.setItems` method is used to set the items (or actions) in the action bar. Each item has an ID, label, and thumbnail.

```typescript
const someThumbnail = world.findImageByName("SomeImage");

thirdroom.actionBar.setItems([
  {
    id: "action1",
    label: "SomeAction",
    thumbnail: someThumbnail,
  },
]);
```

## ActionBarListener

An `ActionBarListener` is used to listen for when items on the action bar are activated.

```typescript
// Create a new ActionBarListener object
const actionBarListener = thirdroom.actionBar.createListener();

for (const actionId of actionBarListener.actions()) {
  if (actionId === "action1") {
    console.log("action1 activated");
  }
}
```
