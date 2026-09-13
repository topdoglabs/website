import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App.jsx";
import "./styles.css";
import "./brand.css";

const element = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
const root = document.getElementById("root");
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, element);
else ReactDOM.createRoot(root).render(element);
