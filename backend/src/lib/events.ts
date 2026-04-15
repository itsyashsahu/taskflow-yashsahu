type EventAction = "create" | "update" | "delete"
type ResourceType = "project" | "task" | "user" | "team"

interface DataEvent {
  action: EventAction
  resource: ResourceType
  id: string
  data?: any
  timestamp: number
}

type EventListener = (event: DataEvent) => void

class EventBroadcaster {
  private listeners: Set<EventListener> = new Set()

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  publish(event: DataEvent): void {
    this.listeners.forEach((listener) => listener(event))
  }
}

export const eventBroadcaster = new EventBroadcaster()

export function emitDataUpdate(
  action: EventAction,
  resource: ResourceType,
  id: string,
  data?: any
): void {
  eventBroadcaster.publish({
    action,
    resource,
    id,
    data,
    timestamp: Date.now(),
  })
}