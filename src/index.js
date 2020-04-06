import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./serviceWorker";
import 'semantic-ui-css/semantic.min.css'
import App from "./components/App";
import "./index.css"

ReactDOM.render(<App />, document.getElementById("root"));

serviceWorker.unregister();
