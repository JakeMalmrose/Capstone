import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
// import localOutputs from "../../amplify_outputs.json";
// Amplify.configure(localOutputs);

import cloudOutputs from "./cloudOutputs2.json";
Amplify.configure(cloudOutputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;