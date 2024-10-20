import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider, createTheme } from '@aws-amplify/ui-react';

Amplify.configure(outputs);

const customTheme = createTheme({
  name: 'myTheme',
  tokens: {
    colors: {
      background: {
        primary: { value: '{colors.blue.10}' },
      },
      font: {
        primary: { value: '{colors.black}' },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={customTheme}>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

