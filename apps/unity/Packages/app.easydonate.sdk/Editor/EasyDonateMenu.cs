using UdonSharpEditor;
using UnityEditor;
using UnityEngine;

namespace EasyDonate.SDK.Editor
{
    /// <summary>
    /// GameObject > EasyDonate menu item. The new object is wired up by
    /// <see cref="EasyDonateAutoSetup"/>.
    /// </summary>
    internal static class EasyDonateMenu
    {
        /// <summary>
        /// Creates DonateManager: the receiver with its VRC Midi Listener.
        /// </summary>
        [MenuItem("GameObject/EasyDonate/Donate Manager", false, 10)]
        private static void CreateDonateManager(MenuCommand command)
        {
            var manager = new GameObject("DonateManager");
            GameObjectUtility.SetParentAndAlign(manager, command.context as GameObject);
            // The receiver requires a VRC Midi Listener, which Unity adds with it
            manager.AddUdonSharpComponent<DonateMIDIReceiver>();

            Undo.RegisterCreatedObjectUndo(manager, "Create DonateManager");
            EasyDonateAutoSetup.SetUpOpenScenes();
            Selection.activeGameObject = manager;
        }
    }
}
