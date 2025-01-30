Analysis
From reviewing both the server-side streaming endpoint (in “route.ts”) and the front-end client code in “TicketList.tsx,” the likely reason the streaming completion is “failing” (or at least not behaving as expected) boils down to a mismatch in the event names sent by the server vs. those listened for by the client.
---
1. The Server-Side Events
Looking at your GET handler in:
You call:
sendEvent("status", { … }) → which actually produces event: content\n data: { type: "status", ... }.
sendEvent("content", { content }) → which produces event: content\n data: { type: "content", content: ... }.
Finally, you do something like sendEvent("content", { content: generatedContent, isFinal: true }) or sendEvent("status", { message: "[DONE]" }).
But crucially, nowhere in the GET route do you send a literal:
event: complete
Instead, you send “event: content” with a property isFinal: true, and the next call is “event: content” with the object type: "status", message: "[DONE]", etc.
---
2. The Client-Side Listener
Meanwhile, in “TicketList.tsx,” the relevant piece is:
And then:
The client code specifically expects:
event: "complete"
to be sent from the server. However, based on the server code, we don’t see any sendEvent("complete", ...) function calls in that GET handler. Instead, it ends with:
“event: content” with isFinal: true,
“event: status” with message: “[DONE]” (but that still sends an event: content line with a JSON object whose type property is “status”).
Those events never match event type "complete" on the client because the SSE “event: …” on the server is literally always "event: content" — the type field in the JSON is "content" or "status," but not the SSE event name.
Hence, the client’s “complete” listener never fires.
---
3. How To Fix
You have two main options:
Use the same event name on both sides.
If your client is listening for “event: complete,” then in your server code, call sendEvent("complete", { myDataHere }) and actually write out:
Then the client can do:
Or:
Use the “content” / “status” approach, but handle them properly in the client.
If you want each SSE to always be “event: content,” then the client needs to do:
That means you’d remove the 'complete' listener from the front end and handle the “isFinal: true” or “message: '[DONE]'” conditions under your “content” event listener.
In short: If your front end is waiting for an SSE with event: complete, but the server never actually sends that SSE event name, you’ll never see that callback happen—and you’ll appear to “hang” or “fail.”
---
4. Additional Thoughts
• Separately, you have a 10-second timeout inside the streaming loop on the server. If OpenAI’s streaming chunks are too far apart, that triggers an event telling the server to “break” out of the loop. That can lead to “Stream timeout” errors. You can remove or lengthen that 10-second check:
Either remove or increase this condition if you want slower streams to keep going.
• Make sure that, when the server closes the writer, you have fully handled the final event. If the front end attempts to read after the server’s closed the connection, it might also cause an error on the client. Just ensure that your order of events matches your front-end expectations.
---
5. Recommended Fix
At a high level, you want something like:
Server
At the very end of your streaming logic, send a final “complete” event. For example:
And make sure that function literally writes:
Client
Then on the client side:
Or if you prefer to keep the event name as 'content' and 'status', remove the 'complete' listener from the client. Instead, inside 'status', check if the “message” is "[DONE]" and handle final logic there.
Either route, just keep them consistent between server and client.
---
Summary
The streaming logic fails primarily because the front end is waiting for an SSE “complete” event that the server never sends. Updating your code so that both sides use matching event names—whether that’s “complete” or using only “content” with a special property (like isFinal)—should fix the problem.