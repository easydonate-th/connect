using UdonSharp;
using UnityEngine;
using VRC.SDK3.Data;
using VRC.SDK3.Midi;
using VRC.SDKBase;

namespace EasyDonate.SDK
{
    /// <summary>
    /// Receives donations from EasyDonate Connect over MIDI, shares them with
    /// every player in the instance and passes each one to the scene's
    /// <see cref="DonationListener"/> scripts.
    /// </summary>
    /// <remarks>
    /// The desktop app sends each donation as JSON, one character per Control
    /// Change on the selected channel (see
    /// apps/desktop/src/bun/libs/vrc/midi/utils.ts):
    /// CC 20 starts a message, CC 21 carries one character, and CC 22 ends it
    /// with a checksum (the sum of all character codes, keeping the low 7 bits).
    ///
    /// Only the streamer's client receives MIDI: Udon gets MIDI events through
    /// the VRC Midi Listener on this object, and only on the client launched
    /// with --midi=&lt;device name&gt;. That client takes ownership, writes the
    /// donation into a synced history of the last <see cref="HistorySize"/>
    /// donations and serializes it. Every client, the streamer's included, then
    /// passes the donations it has not seen yet to the listeners.
    ///
    /// Players who join later get the current history and totals through
    /// <see cref="DonationListener.OnDonationsUpdated"/>, but no
    /// <see cref="DonationListener.OnDonation"/> calls for earlier donations.
    ///
    /// <see cref="allowedUsernames"/> stops other players' clients from posting
    /// donations or taking ownership. It does not protect against modified
    /// clients.
    /// </remarks>
    [UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]
    [RequireComponent(typeof(VRCMidiListener))]
    public class DonateMIDIReceiver : UdonSharpBehaviour
    {
        /// <summary>
        /// Number of recent donations kept for players who join later.
        /// </summary>
        public const int HistorySize = 10;

        private const int CcStart = 20;
        private const int CcData = 21;
        private const int CcEnd = 22;

        // Longer text is cut to keep each serialization small (synced strings
        // take 2 bytes per character)
        private const int MaxReferenceLength = 64;
        private const int MaxNameLength = 64;
        private const int MaxMessageLength = 200;

        [Tooltip("MIDI channel selected in EasyDonate Connect (1-16)")]
        [Range(1, 16)]
        public int midiChannel = 1;

        [Tooltip(
            "VRChat display names allowed to post donations, usually the streamer's, "
                + "exactly as shown in game. Leave empty to allow anyone whose client "
                + "receives the MIDI messages."
        )]
        public string[] allowedUsernames = new string[0];

        // Every DonationListener in the scene. The Editor fills this in and it
        // must be saved with the scene, so it stays serialized but hidden.
        [HideInInspector]
        public DonationListener[] listeners = new DonationListener[0];

        [UdonSynced] private int donationCount;
        [UdonSynced] private double totalAmount;

        // Ring buffer: donation n is stored at n % HistorySize
        [UdonSynced] private string[] referenceNos = new string[HistorySize];
        [UdonSynced] private string[] donatorNames = new string[HistorySize];
        [UdonSynced] private string[] messages = new string[HistorySize];
        [UdonSynced] private double[] amounts = new double[HistorySize];
        [UdonSynced] private long[] timestamps = new long[HistorySize];

        // MIDI message being received
        private string buffer = "";
        private int checksum;
        private bool receiving;

        // Donations already passed to the listeners on this client
        private int handledCount;
        private bool hasReceivedState;

        /// <summary>
        /// Donations posted since the instance started.
        /// </summary>
        public int DonationCount => donationCount;

        /// <summary>
        /// Sum of all donation amounts in THB since the instance started.
        /// </summary>
        public double TotalAmount => totalAmount;

        /// <summary>
        /// Number of donations in the history, up to <see cref="HistorySize"/>.
        /// </summary>
        public int RecentCount => Mathf.Min(donationCount, HistorySize);

        private void Start()
        {
            // Synced string arrays must not contain null
            FillEmpty(referenceNos);
            FillEmpty(donatorNames);
            FillEmpty(messages);

            // Lets listeners show their empty state before any sync arrives
            SendDonationsUpdated();
        }

        public override void MidiControlChange(int channel, int number, int value)
        {
            // Udon reports channels 0-15, the desktop app uses 1-16
            if (channel != midiChannel - 1)
            {
                return;
            }

            if (number == CcStart)
            {
                buffer = "";
                checksum = 0;
                receiving = true;
            }
            else if (number == CcData)
            {
                if (!receiving)
                {
                    return;
                }

                buffer += (char)value;
                checksum = (checksum + value) % 128;
            }
            else if (number == CcEnd)
            {
                if (!receiving)
                {
                    return;
                }

                receiving = false;
                string json = buffer;
                buffer = "";

                if (value != checksum)
                {
                    Debug.LogWarning(
                        "[EasyDonate] Dropped a donation with a bad checksum "
                            + $"(expected {checksum}, got {value})"
                    );
                    return;
                }

                HandleMessage(json);
            }
        }

        /// <summary>
        /// Posts a donation to every player from this client. MIDI donations go
        /// through here; call it yourself to post test donations.
        /// </summary>
        /// <param name="amount">Amount in THB</param>
        /// <param name="timestamp">Unix epoch milliseconds on the EasyDonate server</param>
        public void Publish(
            string referenceNo,
            string donatorName,
            string message,
            double amount,
            long timestamp
        )
        {
            VRCPlayerApi localPlayer = Networking.LocalPlayer;

            // There is no local player in Play mode without ClientSim
            if (localPlayer == null)
            {
                Debug.LogWarning(
                    "[EasyDonate] Cannot post donations without a local player. Turn on "
                        + "ClientSim to test in Play mode."
                );
                return;
            }

            if (!IsAllowedUser(localPlayer))
            {
                Debug.LogWarning(
                    $"[EasyDonate] Dropped a donation: {localPlayer.displayName} is not "
                        + "in Allowed Usernames"
                );
                return;
            }

            if (!Networking.IsOwner(gameObject))
            {
                Networking.SetOwner(localPlayer, gameObject);
            }

            if (!Networking.IsOwner(gameObject))
            {
                Debug.LogWarning("[EasyDonate] Could not take ownership, dropped the donation");
                return;
            }

            int slot = donationCount % HistorySize;
            referenceNos[slot] = Truncate(referenceNo, MaxReferenceLength);
            donatorNames[slot] = Truncate(donatorName, MaxNameLength);
            messages[slot] = Truncate(message, MaxMessageLength);
            amounts[slot] = amount;
            timestamps[slot] = timestamp;
            donationCount++;
            totalAmount += amount;
            hasReceivedState = true;
            RequestSerialization();

            // The owner does not get OnDeserialization for its own changes
            Dispatch();
        }

        /// <summary>
        /// Donator name of a donation in the history; age 0 is the newest.
        /// Returns an empty string when there is no such donation.
        /// </summary>
        public string GetDonatorName(int age)
        {
            int slot = GetSlot(age);
            return slot < 0 ? "" : donatorNames[slot];
        }

        /// <summary>
        /// Message of a donation in the history; age 0 is the newest.
        /// </summary>
        public string GetMessage(int age)
        {
            int slot = GetSlot(age);
            return slot < 0 ? "" : messages[slot];
        }

        /// <summary>
        /// Amount in THB of a donation in the history; age 0 is the newest.
        /// </summary>
        public double GetAmount(int age)
        {
            int slot = GetSlot(age);
            return slot < 0 ? 0 : amounts[slot];
        }

        /// <summary>
        /// EasyDonate reference number of a donation in the history; age 0 is
        /// the newest.
        /// </summary>
        public string GetReferenceNo(int age)
        {
            int slot = GetSlot(age);
            return slot < 0 ? "" : referenceNos[slot];
        }

        /// <summary>
        /// Unix epoch milliseconds of a donation in the history; age 0 is the
        /// newest.
        /// </summary>
        public long GetTimestamp(int age)
        {
            int slot = GetSlot(age);
            return slot < 0 ? 0 : timestamps[slot];
        }

        public override void OnDeserialization()
        {
            if (!hasReceivedState)
            {
                // First state on this client, e.g. after joining late: show the
                // history without replaying earlier donations
                hasReceivedState = true;
                handledCount = donationCount;
                SendDonationsUpdated();
                return;
            }

            Dispatch();
        }

        public override bool OnOwnershipRequest(
            VRCPlayerApi requestingPlayer,
            VRCPlayerApi requestedOwner
        )
        {
            // Runs on both the requester and the owner, which share the same
            // Inspector list, so both reach the same answer
            return IsAllowedUser(requestedOwner);
        }

        private void HandleMessage(string json)
        {
            // VRCJson also unescapes the \uXXXX sequences the desktop app uses
            // for non-ASCII characters
            if (
                !VRCJson.TryDeserializeFromJson(json, out DataToken result)
                || result.TokenType != TokenType.DataDictionary
            )
            {
                Debug.LogWarning("[EasyDonate] Dropped a donation that is not valid JSON");
                return;
            }

            DataDictionary data = result.DataDictionary;

            // VRCJson stores every JSON number as a double
            if (
                !data.TryGetValue("referenceNo", TokenType.String, out DataToken referenceNo)
                || !data.TryGetValue("donatorName", TokenType.String, out DataToken donatorName)
                || !data.TryGetValue("message", TokenType.String, out DataToken message)
                || !data.TryGetValue("amount", TokenType.Double, out DataToken amount)
                || !data.TryGetValue("timestamp", TokenType.Double, out DataToken timestamp)
            )
            {
                Debug.LogWarning("[EasyDonate] Dropped a donation with missing fields");
                return;
            }

            // Unix epoch milliseconds do not fit in an int
            long time = (long)timestamp.Double;
            Debug.Log(
                $"[EasyDonate] {donatorName.String} donated {amount.Double} THB: "
                    + $"{message.String} (ref {referenceNo.String}, at {time})"
            );

            Publish(referenceNo.String, donatorName.String, message.String, amount.Double, time);
        }

        /// <summary>
        /// Passes donations this client has not seen yet to the listeners.
        /// </summary>
        private void Dispatch()
        {
            // Donations older than the history were overwritten before this
            // client saw them
            int first = Mathf.Max(handledCount, donationCount - HistorySize);
            handledCount = donationCount;

            for (int index = first; index < donationCount; index++)
            {
                int slot = index % HistorySize;

                for (int i = 0; i < listeners.Length; i++)
                {
                    if (listeners[i] != null)
                    {
                        listeners[i].OnDonation(
                            referenceNos[slot],
                            donatorNames[slot],
                            messages[slot],
                            amounts[slot],
                            timestamps[slot]
                        );
                    }
                }
            }

            SendDonationsUpdated();
        }

        private void SendDonationsUpdated()
        {
            for (int i = 0; i < listeners.Length; i++)
            {
                if (listeners[i] != null)
                {
                    listeners[i].OnDonationsUpdated(this);
                }
            }
        }

        private int GetSlot(int age)
        {
            if (age < 0 || age >= RecentCount)
            {
                return -1;
            }

            return (donationCount - 1 - age) % HistorySize;
        }

        private bool IsAllowedUser(VRCPlayerApi player)
        {
            if (allowedUsernames == null || allowedUsernames.Length == 0)
            {
                return true;
            }

            if (player == null || !player.IsValid())
            {
                return false;
            }

            string displayName = player.displayName;

            for (int i = 0; i < allowedUsernames.Length; i++)
            {
                if (allowedUsernames[i] != null && allowedUsernames[i].Trim() == displayName)
                {
                    return true;
                }
            }

            return false;
        }

        private string Truncate(string text, int maxLength)
        {
            if (text == null)
            {
                return "";
            }

            return text.Length > maxLength ? text.Substring(0, maxLength) : text;
        }

        private void FillEmpty(string[] values)
        {
            for (int i = 0; i < values.Length; i++)
            {
                if (values[i] == null)
                {
                    values[i] = "";
                }
            }
        }
    }
}
