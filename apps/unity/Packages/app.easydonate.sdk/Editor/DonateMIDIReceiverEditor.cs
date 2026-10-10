using UdonSharpEditor;
using UnityEditor;

namespace EasyDonate.SDK.Editor
{
    /// <summary>
    /// Inspector for <see cref="DonateMIDIReceiver"/> that shows what it is
    /// connected to and warns about setup problems.
    /// </summary>
    /// <remarks>
    /// Udon cannot choose a MIDI device, so the receiver has no device setting.
    /// </remarks>
    [CustomEditor(typeof(DonateMIDIReceiver))]
    public class DonateMIDIReceiverEditor : UnityEditor.Editor
    {
        public override void OnInspectorGUI()
        {
            if (UdonSharpGUI.DrawDefaultUdonSharpBehaviourHeader(target))
            {
                return;
            }

            var receiver = (DonateMIDIReceiver)target;

            if (receiver.allowedUsernames == null || receiver.allowedUsernames.Length == 0)
            {
                EditorGUILayout.HelpBox(
                    "Anyone whose VRChat client receives the MIDI messages can post "
                        + "donations. Add the streamer’s display name to “Allowed "
                        + "Usernames” to limit it.",
                    MessageType.Warning
                );
            }

            if (receiver.gameObject.scene.IsValid() && !EditorUtility.IsPersistent(receiver))
            {
                int receiverCount = EasyDonateAutoSetup
                    .FindInScene<DonateMIDIReceiver>(receiver.gameObject.scene)
                    .Length;

                if (receiverCount > 1)
                {
                    EditorGUILayout.HelpBox(
                        "This scene has more than one Donate MIDI Receiver. Each one "
                            + "sends every donation to all listeners, so keep only one.",
                        MessageType.Warning
                    );
                }

                EditorGUILayout.HelpBox(
                    DescribeListeners(receiver.listeners == null ? 0 : receiver.listeners.Length),
                    MessageType.Info
                );
            }

            EditorGUILayout.HelpBox(
                "Choose the MIDI device for Play mode in VRChat SDK › Utilities › "
                    + "Midi. In VRChat, launch with --midi=<device name>.",
                MessageType.Info
            );
            EditorGUILayout.Space();
            base.OnInspectorGUI();
        }

        private static string DescribeListeners(int count)
        {
            if (count == 0)
            {
                return "No Donate Triggers or other listeners in this scene yet.";
            }

            string noun = count == 1 ? "listener" : "listeners";
            return $"Sends donations to {count} {noun} in this scene, found automatically.";
        }
    }
}
