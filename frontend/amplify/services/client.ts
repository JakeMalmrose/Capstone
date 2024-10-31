import { Amplify } from '@aws-amplify/core';
import { generateClient } from "@aws-amplify/api";
import type { Schema } from "../data/resource";
import cloudOutputs from "./cloudOutputs2.json";
import localOutputs from "./localOutputs2.json";
import { secret } from "@aws-amplify/backend";

const weinprod = secret('isprod');

if (weinprod) {
  Amplify.configure(cloudOutputs);
} else {
  Amplify.configure(localOutputs);
}

const client = generateClient<Schema>({
    authMode: 'apiKey'
  });

export default client;