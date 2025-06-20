import React from "react";
import ReactDOM from "react-dom/client";
import './index.css'
import {RouterProvider} from "react-router-dom";
import route from "./route.tsx";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={route} />
  </React.StrictMode>,
);
