import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import cloudOutputs from "./cloudoutputs.json";
import localOutputs from "./localoutputs.json";

const outputs = process.env.NODE_ENV === 'production' ? cloudOutputs : localOutputs;

Amplify.configure(outputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;