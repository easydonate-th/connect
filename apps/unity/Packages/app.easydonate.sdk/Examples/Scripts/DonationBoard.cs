using TMPro;
using UdonSharp;
using UnityEngine;

namespace EasyDonate.SDK.Examples
{
    /// <summary>
    /// Text board that lists the newest donations and the total so far.
    /// </summary>
    /// <remarks>
    /// The rows are rebuilt from the receiver's history in
    /// <see cref="OnDonationsUpdated"/>, so players who join later see the
    /// same list as everyone else.
    /// </remarks>
    [UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
    public class DonationBoard : DonationListener
    {
        [Tooltip("Shows the total amount and the number of donations")]
        public TextMeshProUGUI totalText;

        [Tooltip("Shown while there are no donations yet")]
        public GameObject emptyState;

        [Header("Rows (newest first)")]
        [Tooltip("One object per row; rows without a donation are hidden")]
        public GameObject[] rows = new GameObject[0];

        [Tooltip("Donator name and amount of each row")]
        public TextMeshProUGUI[] headerTexts = new TextMeshProUGUI[0];

        [Tooltip("Message of each row")]
        public TextMeshProUGUI[] messageTexts = new TextMeshProUGUI[0];

        [Tooltip("Shown for donations without a donator name")]
        public string anonymousName = "Anonymous";

        public override void OnDonationsUpdated(DonateMIDIReceiver receiver)
        {
            int count = receiver.RecentCount;

            if (totalText != null)
            {
                totalText.text =
                    $"Total {FormatAmount(receiver.TotalAmount)} THB from "
                    + $"{receiver.DonationCount} donations";
            }

            if (emptyState != null)
            {
                emptyState.SetActive(count == 0);
            }

            int rowCount = Mathf.Min(
                rows.Length,
                Mathf.Min(headerTexts.Length, messageTexts.Length)
            );

            // Age 0 is the newest donation
            for (int age = 0; age < rowCount; age++)
            {
                bool hasDonation = age < count;

                if (rows[age] != null)
                {
                    rows[age].SetActive(hasDonation);
                }

                if (!hasDonation)
                {
                    continue;
                }

                string donatorName = receiver.GetDonatorName(age);

                if (string.IsNullOrEmpty(donatorName))
                {
                    donatorName = anonymousName;
                }

                if (headerTexts[age] != null)
                {
                    headerTexts[age].text =
                        $"{donatorName}  {FormatAmount(receiver.GetAmount(age))} THB";
                }

                if (messageTexts[age] != null)
                {
                    messageTexts[age].text = receiver.GetMessage(age);
                }
            }
        }

        private string FormatAmount(double amount)
        {
            // Thousands separators, and satang only when there are any
            return amount.ToString("#,0.##");
        }
    }
}
