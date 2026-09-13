import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { App } from "./App.jsx";

export const render = (url) => renderToString(<StaticRouter location={url}><App /></StaticRouter>);
