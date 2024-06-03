import React from "react";
import ReactDOM from "react-dom/client";

import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Sepolia, Base } from "@thirdweb-dev/chains";

import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThirdwebProvider
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
      activeChain={import.meta.env.VITE_NETWORK == "sepolia" ? Sepolia : Base}
      sdkOptions={{
        gasless: {
          openzeppelin: {
            relayerUrl: import.meta.env.VITE_RELAYER_URL,
            useEOAForwarder: false,
          },
        },
      }}
    >
      <App />
    </ThirdwebProvider>
  </React.StrictMode>
);
