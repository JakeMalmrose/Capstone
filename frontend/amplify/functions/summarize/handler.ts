import type { Schema } from "../../data/resource"

export const handler: Schema["summarize"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`
  const { text } = event.arguments
  // return typed from `.returns()`
  return `Summary of ${text}`
}