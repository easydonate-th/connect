# EasyDonate SDK Examples

Three prefabs to drag into a scene. Each one needs a **DonateManager** in the scene (**GameObject > EasyDonate > Donate Manager**), which finds them on its own. All of them react to every donation (Min Amount 0), so the **Send test donation** button in EasyDonate Connect (100 THB) plays all three.

| Prefab | What it does |
| --- | --- |
| `Prefabs/DonateLightAndSound` | A floor lamp. A Donate Trigger turns on `Glow` (point light and lit bulb) for 5 seconds and plays `Chime`. |
| `Prefabs/DonationBoard` | A text board with the total and the 5 newest donations. Players who join later see the same list. |
| `Prefabs/DonateGiftBox` | A gift box. A Donate Trigger sends the `Celebrate` custom event to `GiftBox`, which pops the lid and bursts confetti. |

## Light and sound

Uses the package's Donate Trigger only, no code. Change **Active Seconds**, the light on `Glow/Light` or the clip on `Chime` to taste. The chime is 2D (spatialization off on its VRC Spatial Audio Source), so every player hears it wherever they stand. Duplicate the prefab and set **Min Amount** / **Max Amount** for donation tiers.

## Donation board

`Scripts/DonationBoard.cs` subclasses `DonationListener` and rebuilds its rows in `OnDonationsUpdated` from the receiver's history. To show more rows, add rows under `Canvas/Rows` and to the script's **Rows**, **Header Texts** and **Message Texts** lists (the receiver keeps 10 donations). Rich Text is off on every text so donors cannot restyle the board.

The text uses Kanit (`Fonts/Kanit-Regular.ttf`, SIL Open Font License, see `Fonts/OFL.txt`) through a dynamic TextMeshPro font asset, so Thai and Latin names both render. TextMeshPro does not position Thai marks the way a browser does, so stacked marks may sit slightly off.

## Custom event

`Scripts/GiftBoxCelebration.cs` is a plain UdonSharpBehaviour with a public `Celebrate` method. The Donate Trigger on the prefab's root has **Event Target** set to `GiftBox` and **Event Name** set to `Celebrate`. Any UdonBehaviour works as a target, including Udon Graph programs: the event name must match a public method or custom event exactly.
