# EasyDonate SDK for VRChat Worlds

Shows EasyDonate donations inside a VRChat world. The streamer runs EasyDonate Connect on their PC. It sends each donation to VRChat over MIDI, and this package shares it with every player in the instance so the world can react.

Requires VRChat SDK Worlds 3.10.5 or later (UdonSharp is included in the SDK).

## Setup

1. In EasyDonate Connect, turn on **VRC/MIDI**, pick your loopMIDI port and a channel, and save.
2. In Unity, choose **GameObject > EasyDonate > Donate Manager**. It creates `DonateManager`, which holds the **Donate MIDI Receiver** and its VRC Midi Listener.
3. On `DonateManager`, set **Midi Channel** to the channel used in EasyDonate Connect, and add the streamer's VRChat display name to **Allowed Usernames**.
4. Add **Donate Trigger** components to other objects for the effects you want. Keep them off `DonateManager` itself.
5. Launch VRChat with `--midi=<loopMIDI port name>`, for example in Steam's launch options.

There is nothing to connect by hand. The Editor points the receiver's VRC Midi Listener at it and finds every Donate Trigger and other `DonationListener` script in the scene on its own. Use one receiver per scene.

## How it works

```text
EasyDonate Connect (streamer's PC) ──MIDI──▶ VRChat client launched with --midi
                                                      │
                                    Donate MIDI Receiver (streamer's client)
                                                      │ synced to every player
                                                      ▼
                              Donate Triggers and your own listeners
                                         (run on every client)
```

- Only the streamer's client receives MIDI; VRChat reads MIDI on Windows only. The receiver syncs each donation to everyone, including Quest and iOS players.
- Players who join later get the recent history and totals, but triggers do not replay for donations made before they joined.

## Donate MIDI Receiver

Receives donations from EasyDonate Connect, syncs them to every player and passes each one to the scene's listeners. It requires a **VRC Midi Listener**, which Unity adds with it.

| Field | Description |
| --- | --- |
| Midi Channel | MIDI channel selected in EasyDonate Connect (1-16). |
| Allowed Usernames | VRChat display names allowed to post donations, usually the streamer. Empty allows anyone whose client receives the MIDI messages. |

- Each donation is logged to the console: `[EasyDonate] <name> donated <amount> THB: <message> ...`.
- Allowed Usernames stops ordinary clients from posting fake donations or taking ownership of the receiver. It does not protect against modified clients.
- The last 10 donations are kept for players who join later. Names and reference numbers are cut to 64 characters and messages to 200.
- Totals count from when the instance started.
- Keep other UdonBehaviours, such as Donate Triggers, off the receiver's object: all UdonBehaviours on one object must share a sync mode, and the receiver uses Manual sync.
- Udon cannot choose a MIDI device. Play mode uses the device chosen in **VRChat SDK > Utilities > Midi**; VRChat uses `--midi=<device name>`.

## Donate Trigger

Plays effects when a donation's amount is in range. No code needed. Use several triggers with different ranges for donation tiers.

| Field | Description |
| --- | --- |
| Min Amount | Smallest amount in THB that plays the effects. |
| Max Amount | Largest amount in THB that plays the effects; 0 means no limit. |
| Activate Objects | Objects to turn on, such as particles that play on awake. Leave out the trigger's own object. |
| Active Seconds | Seconds before those objects turn off again; 0 keeps them on. |
| Animator | Animator that gets the trigger below. |
| Animator Trigger | Trigger parameter to set on the Animator. |
| Audio Source | Sound to play. |
| Event Target | UdonBehaviour (UdonSharp or Udon Graph) that gets the custom event below. |
| Event Name | Custom event to send to Event Target. |

When donations overlap, the objects stay on until the last one's timer ends.

## Writing your own listener

Subclass `DonationListener` and override what you need. The receiver finds the script by itself.

```csharp
using EasyDonate.SDK;
using UdonSharp;
using UnityEngine;

[UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
public class DonationText : DonationListener
{
    public TMPro.TextMeshProUGUI label;

    public override void OnDonation(
        string referenceNo,
        string donatorName,
        string message,
        double amount,
        long timestamp
    )
    {
        label.text = $"{donatorName}: {amount} THB\n{message}";
    }

    public override void OnDonationsUpdated(DonateMIDIReceiver receiver)
    {
        Debug.Log($"Total so far: {receiver.TotalAmount} THB");
    }
}
```

| Method | When it runs |
| --- | --- |
| `OnDonation(...)` | Once per new donation, on every client. `amount` is in THB; `timestamp` is Unix epoch milliseconds on the EasyDonate server. |
| `OnDonationsUpdated(receiver)` | When the receiver starts, after every new donation, and when a player who joined late first receives the history. |

Both run on every player's client, so keep them local (no ownership or synced variables needed). Turn off Rich Text on any TextMeshPro text that shows donor names or messages, so donors cannot restyle the world with tags.

The receiver also exposes the history (age 0 is the newest donation):

| Member | Returns |
| --- | --- |
| `DonationCount` | Donations posted since the instance started |
| `TotalAmount` | Sum of all amounts in THB since the instance started |
| `RecentCount` | Donations in the history, up to 10 |
| `GetDonatorName(age)`, `GetMessage(age)`, `GetReferenceNo(age)` | Text of a donation in the history, or `""` |
| `GetAmount(age)` | Amount in THB, or `0` |
| `GetTimestamp(age)` | Unix epoch milliseconds on the EasyDonate server, or `0` |
| `Publish(referenceNo, donatorName, message, amount, timestamp)` | Posts a donation from the local client, e.g. a test button |

## Testing

1. Pick your loopMIDI port in **VRChat SDK > Utilities > Midi** before entering Play mode.
2. Turn on ClientSim. Posting donations needs a local player.
3. Enter Play mode and click **Send test donation** in EasyDonate Connect (the widget socket must be disconnected).

| Symptom | Check |
| --- | --- |
| Nothing in the console | The MIDI channels match and the Midi window has the right device. |
| `Dropped a donation with a bad checksum` | MIDI messages were lost; send again. |
| `Cannot post donations without a local player` | Turn on ClientSim. |
| `Dropped a donation: ... is not in Allowed Usernames` | Add that display name to Allowed Usernames. |
| Logged, but nothing reacts | The trigger's amount range, and that the scene has only one receiver. |
