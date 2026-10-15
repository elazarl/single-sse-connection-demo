# One SSE connection, delayed Node.js messages

Click **Send a message in 2 seconds**. A POST schedules work on the Node server. After 2000 ms, the server writes a message to the browser's existing SSE stream. Repeated clicks reuse that stream; the page displays its ID and message count.

Run `npm start`, then open http://localhost:3000. No dependencies are needed.

In StackBlitz, allow the project to start and use the preview pane. Desktop Chrome or Edge is recommended for WebContainers. The Node server runs in a browser WebContainer, so no local setup is required.

- `server.js`: persistent `GET /events`, heartbeat, delayed `POST /send`, cleanup on disconnect.
- `index.html`: one `EventSource` created on load, click handler, visible event log.

SSE is a one-way HTTP stream, not a WebSocket. Button clicks use separate short HTTP POST requests. This demo does not implement replay of missed events. On reconnect the server creates a new stream ID and cancels work belonging to the closed stream.
