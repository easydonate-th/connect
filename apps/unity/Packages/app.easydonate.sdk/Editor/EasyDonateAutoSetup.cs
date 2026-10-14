using System.Linq;
using UdonSharpEditor;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using VRC.SDK3.Midi;
using VRC.Udon;

namespace EasyDonate.SDK.Editor
{
    /// <summary>
    /// Wires up every <see cref="DonateMIDIReceiver"/> in the open scenes so
    /// it needs no manual setup: points its VRC Midi Listener at it and fills
    /// its listener list with every <see cref="DonationListener"/> in the scene.
    /// </summary>
    /// <remarks>
    /// Runs after objects or components are added or removed, when a scene is
    /// opened or saved, and before entering Play mode. UdonSharp copies the
    /// result to the UdonBehaviours before Play mode and builds.
    /// </remarks>
    [InitializeOnLoad]
    internal static class EasyDonateAutoSetup
    {
        // VRCMidiListener.behaviour is private, so it is set through its
        // serialized field
        private const string MidiListenerBehaviourField = "behaviour";

        private static bool scheduled;

        static EasyDonateAutoSetup()
        {
            ObjectChangeEvents.changesPublished += OnChangesPublished;
            EditorSceneManager.sceneOpened += (scene, mode) => Schedule();
            EditorSceneManager.sceneSaving += (scene, path) => SetUpScene(scene);
            EditorApplication.playModeStateChanged += state =>
            {
                if (state == PlayModeStateChange.ExitingEditMode)
                {
                    SetUpOpenScenes();
                }
            };
            Schedule();
        }

        internal static void SetUpOpenScenes()
        {
            if (EditorApplication.isPlaying)
            {
                return;
            }

            for (int i = 0; i < SceneManager.sceneCount; i++)
            {
                Scene scene = SceneManager.GetSceneAt(i);

                if (scene.isLoaded)
                {
                    SetUpScene(scene);
                }
            }
        }

        /// <summary>
        /// Components of type <typeparamref name="T"/> in <paramref name="scene"/>,
        /// inactive ones included.
        /// </summary>
        internal static T[] FindInScene<T>(Scene scene)
            where T : Component
        {
            return scene
                .GetRootGameObjects()
                .SelectMany(root => root.GetComponentsInChildren<T>(true))
                .ToArray();
        }

        private static void OnChangesPublished(ref ObjectChangeEventStream stream)
        {
            for (int i = 0; i < stream.length; i++)
            {
                switch (stream.GetEventType(i))
                {
                    case ObjectChangeKind.ChangeScene:
                    case ObjectChangeKind.CreateGameObjectHierarchy:
                    case ObjectChangeKind.DestroyGameObjectHierarchy:
                    case ObjectChangeKind.ChangeGameObjectStructure:
                    case ObjectChangeKind.ChangeGameObjectStructureHierarchy:
                        Schedule();
                        return;
                }
            }
        }

        /// <summary>
        /// Sets up the scenes once on the next Editor update, however many
        /// changes arrive before it.
        /// </summary>
        private static void Schedule()
        {
            if (scheduled)
            {
                return;
            }

            scheduled = true;
            EditorApplication.delayCall += () =>
            {
                scheduled = false;
                SetUpOpenScenes();
            };
        }

        private static void SetUpScene(Scene scene)
        {
            DonationListener[] listeners = FindInScene<DonationListener>(scene);

            foreach (DonateMIDIReceiver receiver in FindInScene<DonateMIDIReceiver>(scene))
            {
                bool changed = SetListeners(receiver, listeners);
                changed |= WireMidiListener(receiver);

                if (changed)
                {
                    EditorSceneManager.MarkSceneDirty(scene);
                }
            }
        }

        private static bool SetListeners(DonateMIDIReceiver receiver, DonationListener[] listeners)
        {
            if (receiver.listeners != null && receiver.listeners.SequenceEqual(listeners))
            {
                return false;
            }

            var serialized = new SerializedObject(receiver);
            SerializedProperty property = serialized.FindProperty(
                nameof(DonateMIDIReceiver.listeners)
            );
            property.arraySize = listeners.Length;

            for (int i = 0; i < listeners.Length; i++)
            {
                property.GetArrayElementAtIndex(i).objectReferenceValue = listeners[i];
            }

            serialized.ApplyModifiedPropertiesWithoutUndo();
            return true;
        }

        /// <summary>
        /// Points the VRC Midi Listener on the receiver's object at it with
        /// Control Change events on, unless it already points elsewhere.
        /// </summary>
        private static bool WireMidiListener(DonateMIDIReceiver receiver)
        {
            UdonBehaviour behaviour = UdonSharpEditorUtility.GetBackingUdonBehaviour(receiver);

            if (behaviour == null)
            {
                return false;
            }

            // Receivers added before the component required a listener have none
            var listener = receiver.GetComponent<VRCMidiListener>();

            if (listener == null)
            {
                listener = receiver.gameObject.AddComponent<VRCMidiListener>();
            }

            var serialized = new SerializedObject(listener);
            SerializedProperty behaviourProperty = serialized.FindProperty(
                MidiListenerBehaviourField
            );
            SerializedProperty eventsProperty = serialized.FindProperty(
                nameof(VRCMidiListener.activeEvents)
            );

            if (behaviourProperty == null || eventsProperty == null)
            {
                Debug.LogError(
                    "[EasyDonate] VRC Midi Listener fields changed in this SDK. Set its "
                        + "Behaviour to the receiver and turn on Control Change by hand.",
                    listener
                );
                return false;
            }

            Object target = behaviourProperty.objectReferenceValue;
            int controlChange = (int)VRCMidiListener.MidiEvents.CC;

            if (target != null && target != behaviour)
            {
                return false;
            }

            if (target == behaviour && (eventsProperty.intValue & controlChange) != 0)
            {
                return false;
            }

            behaviourProperty.objectReferenceValue = behaviour;
            eventsProperty.intValue |= controlChange;
            serialized.ApplyModifiedPropertiesWithoutUndo();
            return true;
        }
    }
}
