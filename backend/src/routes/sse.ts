import { Hono } from "hono"
import { eventBroadcaster } from "../lib/events.js"

const sse = new Hono()

sse.get("/data-updates", (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const encoder2 = new TextEncoder()

      const send = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      const listener = (event: any) => {
        send(event)
      }

      eventBroadcaster.subscribe(listener)

      // Send initial connection message
      send({ type: "connected", timestamp: Date.now() })

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        send({ type: "heartbeat", timestamp: Date.now() })
      }, 30000)

      c.req.raw.signal.addEventListener("abort", () => {
        eventBroadcaster.unsubscribe(listener)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
})

export default sse