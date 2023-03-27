import classNames from "classnames";
import { KBarResults, useMatches } from "kbar";
import { forwardRef } from "react";

import "./SearchResults.css";
import { Text } from "../../../atoms/text/Text";
import { Label } from "../../../atoms/text/Label";
import { Kbd } from "../../../atoms/keyboard/Kbd";

const SearchResultCategory = forwardRef<HTMLDivElement, { children: string }>(({ children }, ref) => {
  return (
    <div ref={ref} className="SearchResultCategory flex items-center gap-sm">
      <Label className="grow">{children}</Label>
    </div>
  );
});

const SearchResultItem = forwardRef<
  HTMLDivElement,
  { active?: boolean; subtitle?: string; shortcuts?: string[]; children: string }
>(({ active, subtitle, shortcuts, children }, ref) => {
  return (
    <div
      ref={ref}
      className={classNames("SearchResultItem flex items-center gap-sm", { "SearchResultItem--active": active })}
    >
      <div className="grow">
        <Text variant="b2" weight="medium">
          {children}
        </Text>
        {subtitle && <Text variant="b3">{subtitle}</Text>}
      </div>
      {shortcuts && shortcuts.length > 0 && (
        <div className="flex items-center gap-xxs">
          {shortcuts.map((shortcut, index) => (
            <Kbd key={shortcut} size="xs">
              {shortcut}
            </Kbd>
          ))}
        </div>
      )}
    </div>
  );
});

export function SearchResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => {
        return typeof item === "string" ? (
          <SearchResultCategory>{item}</SearchResultCategory>
        ) : (
          <SearchResultItem active={active} shortcuts={item.shortcut} subtitle={item.subtitle}>
            {item.name}
          </SearchResultItem>
        );
      }}
    />
  );
}
