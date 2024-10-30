import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import cloudOutputs from "./cloudOutputs.json";
import localOutputs from "./localOutputs.json";

const outputs = process.env.WEINPROD === 'production' ? cloudOutputs : localOutputs;

Amplify.configure(outputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;