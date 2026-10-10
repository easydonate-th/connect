using UdonSharp;
using UnityEngine;
using VRC.Udon;

namespace EasyDonate.SDK
{
    /// <summary>
    /// Plays effects set up in the Inspector for donations within an amount
    /// range.
    /// </summary>
    /// <remarks>
    /// Keep it off the receiver's GameObject: all UdonBehaviours on one
    /// GameObject must share a sync mode, and the receiver uses Manual sync.
    /// </remarks>
    [UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
    public class DonateTrigger : DonationListener
    {
        [Header("Amount (THB)")]
        [Tooltip("Smallest amount that plays the effects")]
        public double minAmount;

        [Tooltip("Largest amount that plays the effects; 0 means no limit")]
        public double maxAmount;

        [Header("Effects")]
        [Tooltip(
            "Objects to turn on, e.g. particles that play on awake. Leave out this "
                + "trigger's own object, or it turns itself off."
        )]
        public GameObject[] activateObjects = new GameObject[0];

        [Tooltip("Seconds before the objects turn off again; 0 keeps them on")]
        public float activeSeconds = 5f;

        [Tooltip("Animator that gets the trigger below")]
        public Animator animator;

        [Tooltip("Trigger parameter to set on the Animator")]
        public string animatorTrigger = "";

        public AudioSource audioSource;

        [Header("Custom Event")]
        [Tooltip("UdonBehaviour that gets the event below")]
        public UdonBehaviour eventTarget;

        public string eventName = "";

        // Timers still running for activateObjects, so an earlier donation's
        // timer does not turn them off during a later one
        private int pendingDeactivations;

        public override void OnDonation(
            string referenceNo,
            string donatorName,
            string message,
            double amount,
            long timestamp
        )
        {
            if (amount < minAmount || (maxAmount > 0 && amount > maxAmount))
            {
                return;
            }

            for (int i = 0; i < activateObjects.Length; i++)
            {
                if (activateObjects[i] != null)
                {
                    activateObjects[i].SetActive(true);
                }
            }

            if (activeSeconds > 0 && activateObjects.Length > 0)
            {
                pendingDeactivations++;
                SendCustomEventDelayedSeconds(nameof(_Deactivate), activeSeconds);
            }

            if (animator != null && !string.IsNullOrEmpty(animatorTrigger))
            {
                animator.SetTrigger(animatorTrigger);
            }

            if (audioSource != null)
            {
                audioSource.Play();
            }

            if (eventTarget != null && !string.IsNullOrEmpty(eventName))
            {
                eventTarget.SendCustomEvent(eventName);
            }
        }

        /// <summary>
        /// Turns the objects off when the last running timer ends.
        /// </summary>
        public void _Deactivate()
        {
            pendingDeactivations--;

            if (pendingDeactivations > 0)
            {
                return;
            }

            pendingDeactivations = 0;

            for (int i = 0; i < activateObjects.Length; i++)
            {
                if (activateObjects[i] != null)
                {
                    activateObjects[i].SetActive(false);
                }
            }
        }
    }
}
