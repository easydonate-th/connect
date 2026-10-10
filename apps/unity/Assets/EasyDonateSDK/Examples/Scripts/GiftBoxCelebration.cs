using UdonSharp;
using UnityEngine;

namespace EasyDonate.SDK.Examples
{
    /// <summary>
    /// Gift box that pops its lid and bursts confetti when it gets the
    /// <see cref="Celebrate"/> custom event.
    /// </summary>
    /// <remarks>
    /// This is a plain UdonBehaviour, not a <see cref="DonationListener"/>: a
    /// Donate Trigger calls it through Event Target and Event Name, so the same
    /// script also works from buttons or other Udon scripts.
    /// </remarks>
    [UdonBehaviourSyncMode(BehaviourSyncMode.NoVariableSync)]
    public class GiftBoxCelebration : UdonSharpBehaviour
    {
        [Tooltip("Box body that squashes and bounces")]
        public Transform body;

        [Tooltip("Lid that jumps off the box and spins")]
        public Transform lid;

        [Tooltip("Particle system that the confetti is emitted from")]
        public ParticleSystem confetti;

        [Tooltip("Confetti pieces per celebration")]
        public int confettiCount = 150;

        [Tooltip("Seconds the box animation lasts")]
        public float duration = 1.5f;

        [Tooltip("How high the lid jumps, in meters")]
        public float lidJumpHeight = 0.5f;

        private Vector3 bodyRestScale;
        private Vector3 lidRestPosition;
        private Quaternion lidRestRotation;
        private bool initialized;
        private bool playing;
        private float elapsed;

        private void Start()
        {
            Initialize();
        }

        /// <summary>
        /// Plays the celebration. Send it as a custom event, e.g. from a Donate
        /// Trigger's Event Name.
        /// </summary>
        public void Celebrate()
        {
            Initialize();
            elapsed = 0f;
            playing = true;

            if (confetti != null)
            {
                confetti.Emit(confettiCount);
            }
        }

        private void Update()
        {
            if (!playing)
            {
                return;
            }

            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / duration);

            if (lid != null)
            {
                // One jump up and back down with a full spin
                float jump = 4f * t * (1f - t);
                lid.localPosition = lidRestPosition + Vector3.up * (lidJumpHeight * jump);
                lid.localRotation = lidRestRotation * Quaternion.Euler(0f, 360f * t, 0f);
            }

            if (body != null)
            {
                // Squash and stretch that settles by the end
                float squash = Mathf.Sin(t * Mathf.PI * 4f) * (1f - t) * 0.15f;
                body.localScale = new Vector3(
                    bodyRestScale.x * (1f + squash),
                    bodyRestScale.y * (1f - squash),
                    bodyRestScale.z * (1f + squash)
                );
            }

            if (t >= 1f)
            {
                playing = false;
            }
        }

        /// <summary>
        /// Remembers the rest pose, also when the event arrives before Start.
        /// </summary>
        private void Initialize()
        {
            if (initialized)
            {
                return;
            }

            initialized = true;

            if (body != null)
            {
                bodyRestScale = body.localScale;
            }

            if (lid != null)
            {
                lidRestPosition = lid.localPosition;
                lidRestRotation = lid.localRotation;
            }
        }
    }
}
