import { inngest } from "inngest"

export const inngest = new inngest({
  id: "content-pipeline",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  eventKey: process.env.INNGEST_EVENT_KEY,
})