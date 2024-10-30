import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import outputs from "./outputs.json";
import localOutputs from "./localoutputs.json";

const newOutputs = process.env.NODE_ENV === 'production' ? outputs : localOutputs;

Amplify.configure(newOutputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;