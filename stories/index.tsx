import ReactDOM from "react-dom";
import "../src/ui/App.css";

import { AtomsStories } from "./atoms";
import { ViewsStories } from "./views";

ReactDOM.render(
  <div>
    <AtomsStories />
    <ViewsStories />
  </div>,
  document.getElementById("root")
);
