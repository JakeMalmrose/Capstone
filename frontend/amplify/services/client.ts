import { Amplify } from '@aws-amplify/core';
import outputs from "../../amplify_outputs.json";
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";

Amplify.configure(outputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;