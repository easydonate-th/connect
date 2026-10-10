using UdonSharp;

namespace EasyDonate.SDK
{
    /// <summary>
    /// Base class for scripts that react to donations. Subclass it and override
    /// the methods you need; the scene's <see cref="DonateMIDIReceiver"/> finds
    /// every listener in the scene by itself.
    /// </summary>
    /// <remarks>
    /// Both methods run on every player's client. Players who join later get
    /// <see cref="OnDonationsUpdated"/> with the current history, but no
    /// <see cref="OnDonation"/> calls for earlier donations.
    /// </remarks>
    public abstract class DonationListener : UdonSharpBehaviour
    {
        /// <summary>
        /// Called for each new donation.
        /// </summary>
        /// <param name="referenceNo">EasyDonate reference number</param>
        /// <param name="amount">Amount in THB</param>
        /// <param name="timestamp">Unix epoch milliseconds on the EasyDonate server</param>
        public virtual void OnDonation(
            string referenceNo,
            string donatorName,
            string message,
            double amount,
            long timestamp
        ) { }

        /// <summary>
        /// Called when the receiver starts and after its history or totals
        /// change, including when a player who joined late first receives them.
        /// Read them from <paramref name="receiver"/>.
        /// </summary>
        public virtual void OnDonationsUpdated(DonateMIDIReceiver receiver) { }
    }
}
