import { KBarAnimator, KBarPortal, KBarPositioner, KBarSearch } from "kbar";

import "./CmdPanel.css";
import { SearchResults } from "./SearchResults";

export const defaultActions = [];

export function CmdPanel() {
  return (
    <KBarPortal>
      <KBarPositioner className="CmdPanel__positioner">
        <KBarAnimator>
          <div className="CmdPanel">
            <KBarSearch className="CmdPanel__search-input" size={1} />
            <SearchResults />
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
}
