# Not So Secure Container

Your secure container is no longer safe. Items in your secure container will be deleted on death, but you'll keep the container.

This mod can optionally be configured to also delete items from special slots on death and specify items in either location that won't be deleted when you die.

## Exempt Items

Exempt items will *only* affect this mod's feature, it does not affect normal deletion. This means if you make the Multitool exempt, it will still be deleted if it's in your pocket or backpack, but not if it's in a special slot.

By default, only the DSP transmitter is exempt from this mod's deletion.

The list requires the item ID, you can find these [here](https://db.sp-tarkov.com/search) by searching for an item by name. An item's parent ID is also valid, for example including `"550aa4cd4bdc2dd8348b456c"` will allow you to keep any suppresssors in your secure container when you die.
