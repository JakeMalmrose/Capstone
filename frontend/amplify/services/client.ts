import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import cloudOutputs from "./cloudOutputs2.json";
import localOutputs from "./localOutputs2.json";

const outputs = process.env.WEINPROD2 === 'yes' ? cloudOutputs : localOutputs;

Amplify.configure(outputs);

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;