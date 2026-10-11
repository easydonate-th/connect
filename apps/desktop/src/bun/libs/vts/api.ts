/**
 * The VTube Studio Plugin API requests this app sends, keyed by
 * `messageType`, with their `data` payloads and responses. See
 * https://github.com/DenchiSoft/VTubeStudio#api-details.
 */

export type PluginInfo = {
  /** 3-32 characters */
  pluginName: string
  /** 3-32 characters */
  pluginDeveloper: string
}

/** Item move fade curve, used when `timeInSeconds` is above 0 */
export type FadeMode =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeBoth'
  | 'overshoot'
  | 'zip'

export type ItemMove = {
  itemInstanceID: string
  timeInSeconds: number
  fadeMode: FadeMode
  /** -1000 or lower leaves a position, size, rotation or order unchanged */
  positionX: number
  positionY: number
  size: number
  rotation: number
  order: number
  setFlip: boolean
  flip: boolean
  userCanStop: boolean
}

export type APIRequests = {
  /** Shows the plugin approval popup in VTube Studio */
  AuthenticationTokenRequest: {
    data: PluginInfo
    response: { authenticationToken: string }
  }
  AuthenticationRequest: {
    data: PluginInfo & { authenticationToken: string }
    response: { authenticated: boolean; reason: string }
  }
  APIStateRequest: {
    data: Record<string, never>
    response: {
      active: boolean
      vTubeStudioVersion: string
      currentSessionAuthenticated: boolean
    }
  }
  /** Answers at once if granted, otherwise shows a popup in VTube Studio */
  PermissionRequest: {
    data: { requestedPermission: 'LoadCustomImagesAsItems' }
    response: {
      grantSuccess: boolean
      permissions: { name: string; granted: boolean }[]
    }
  }
  CurrentModelRequest: {
    data: Record<string, never>
    response: {
      /** False while no model is loaded or one is loading */
      modelLoaded: boolean
      modelName: string
      modelPosition: {
        positionX: number
        positionY: number
        rotation: number
        size: number
      }
    }
  }
  ItemListRequest: {
    data: {
      includeAvailableSpots: boolean
      includeItemInstancesInScene: boolean
      /** Reads the `Items` folder from disk, so VTube Studio may stutter */
      includeAvailableItemFiles: boolean
    }
    response: {
      availableItemFiles: { fileName: string; type: string }[]
    }
  }
  ItemLoadRequest: {
    data: {
      fileName: string
      /** Screen edges are at -1 and 1 */
      positionX: number
      positionY: number
      /** 0 to 1; 0.32 is the size of an item loaded by hand */
      size: number
      rotation: number
      /** Fade in/out seconds, 0 to 2 */
      fadeTime: number
      unloadWhenPluginDisconnects: boolean
      /**
       * Base64 PNG/JPG/GIF, under 5 MB and 64-2048 px a side. Needs the
       * `LoadCustomImagesAsItems` permission; `fileName` must then be 8-32
       * alphanumerics or hyphens ending in `.png`, `.jpg` or `.gif`.
       */
      customDataBase64?: string
      customDataAskUserFirst?: boolean
    }
    /**
     * For custom data, `fileName` is a name VTube Studio made up, which loads
     * the same image without data until VTube Studio restarts
     */
    response: { instanceID: string; fileName: string }
  }
  /** Should fade out over the `fadeTime` the item was loaded with */
  ItemUnloadRequest: {
    data: {
      unloadAllInScene: boolean
      unloadAllLoadedByThisPlugin: boolean
      allowUnloadingItemsLoadedByUserOrOtherPlugins: boolean
      instanceIDs: string[]
    }
    response: {
      unloadedItems: { instanceID: string; fileName: string }[]
    }
  }
  /**
   * Feeds tracking input parameters (`FaceAngleX` etc.). A parameter falls
   * back to tracking unless it's sent again within a second. `add` adds to
   * the tracked value, and several plugins can add to the same parameter;
   * `set` overrides it and fails while another plugin sets it.
   */
  InjectParameterDataRequest: {
    data: {
      faceFound?: boolean
      mode?: 'set' | 'add'
      parameterValues: { id: string; value: number; weight?: number }[]
    }
    response: Record<string, never>
  }
  ItemMoveRequest: {
    data: { itemsToMove: ItemMove[] }
    response: {
      movedItems: {
        itemInstanceID: string
        success: boolean
        /** -1 on success */
        errorID: number
      }[]
    }
  }
  /** Events then arrive as messages with the event name as `messageType` */
  EventSubscriptionRequest: {
    data: {
      eventName: keyof APIEvents
      subscribe: boolean
      /** `draw` shows the outline in VTube Studio, for debugging */
      config?: { draw: boolean }
    }
    response: { subscribedEventCount: number; subscribedEvents: string[] }
  }
}

type Point = { x: number; y: number }

/** The events this app subscribes to, keyed by name, with their `data` */
export type APIEvents = {
  /** Sent 15 times a second while a model is loaded */
  ModelOutlineEvent: {
    modelName: string
    modelID: string
    /**
     * The model's rough outline, at least 3 points, in window coordinates;
     * points outside the window go past -1 or 1
     */
    convexHull: Point[]
    /** Average of the `convexHull` points */
    convexHullCenter: Point
    windowSize: Point
  }
}

export type APIErrorData = { errorID: number; message: string }

/** Envelope of every message VTube Studio sends */
export type APIMessage = {
  requestID?: string
  messageType: string
  data: unknown
}
