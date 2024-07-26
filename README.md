# Not So Secure Container

Your secure container is no longer safe. Items in your secure container will be deleted on death, but you'll keep the container.

This mod can optionally be configured to also delete items from special slots on death, specify items in either location that won't be deleted, and only have a chance of deleting items.

## Exempt Items

Exempt items will *only* affect this mod's feature, it does not affect normal deletion. This means if you make the Multitool exempt, it will still be deleted if it's in your pocket or backpack, but not if it's in a special slot.

The Mark of the Unheard and DSPT are exempt from this mod's deletion by default.

The list requires the item ID, you can find these [here](https://db.sp-tarkov.com/search) by searching for an item by name. An item's parent ID is also valid, for example including `"550aa4cd4bdc2dd8348b456c"` will allow you to keep any suppresssors in your secure container when you die.

## Remove Secure Container Filter

This feature allows you to put any item that will fit into your secure container. With the other features of the mod, the secure container just becomes extra in-raid space, so this helps avoid some loot juggling.

## Deletion Chance

Items will only have a chance (default 100%) of being deleted.

There are two options available to have a chance of deleting all items as a group or individually. Both options can be used at the same time or alone.
