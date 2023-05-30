import * as fs from "fs";
import * as path from "path";
import { ParameterType, ReflectionKind } from "typedoc";

const DEFAULT_SIDEBAR_OPTIONS = {
  autoConfiguration: true,
  format: "vitepress",
};

function getSidebar(project, basePath) {
  const items = [
    {
      text: "WebSG JavaScript API ",
      link: `/${basePath}/`,
    },
  ];

  for (const group of project.groups) {
    for (const item of group.children) {
      const childItems = getSidebarChildren(item, basePath);

      items.push({
        text: item.name,
        link: `/${basePath}/${item.url}`,
        collapsed: childItems.length > 0 ? false : undefined,
        items: childItems,
      });
    }
  }

  return items;
}

function getSidebarChildren(parent, basePath) {
  if (parent.kind !== ReflectionKind.Namespace) {
    return [];
  }

  const items = [];

  for (const group of parent.groups) {
    if (group.children.length === 0) {
      continue;
    }

    const groupItems = [];

    for (const item of group.children) {
      groupItems.push({
        text: item.name,
        link: `/${basePath}/${item.url}`,
      });
    }

    items.push({
      text: group.title,
      collapsed: false,
      items: groupItems,
    });
  }

  return items;
}

function getNavigationItem(navigationItem, basePath) {
  return {
    text: navigationItem.title,
    link: navigationItem.url ? `/${basePath}/${navigationItem.url}` : null,
    collapsed: true,
    items: navigationItem.children?.flatMap((group) => {
      return getNavigationItem(group, basePath);
    }),
  };
}

export function load(app) {
  app.options.addDeclaration({
    name: "docsRoot",
    help: "",
    type: ParameterType.Path,
    defaultValue: "./docs",
  });

  app.options.addDeclaration({
    name: "sidebar",
    help: "",
    type: ParameterType.Mixed,
    defaultValue: DEFAULT_SIDEBAR_OPTIONS,
  });

  app.options.addReader(
    new (class OptionsReader {
      name = "vitepress-options";
      order = 900;
      supportsPackages = false;
      read(container) {
        Object.entries({
          hideBreadcrumbs: true,
          out: "./docs/websg-js",
          entryDocument: "index.md",
        }).forEach(([key, value]) => {
          container.setValue(key, value);
        });
      }
    })()
  );

  app.renderer.postRenderAsyncJobs.push(async (output) => {
    const sidebarOptions = {
      ...DEFAULT_SIDEBAR_OPTIONS,
      ...app.options.getValue("sidebar"),
    };
    if (sidebarOptions.autoConfiguration) {
      const outDir = app.options.getValue("out");
      const sourceDir = app.options.getValue("docsRoot");
      const sidebarPath = path.resolve(outDir, "typedoc-sidebar.json");
      const basePath = path.relative(sourceDir, outDir);
      const sidebarJson = getSidebar(output.project, basePath, sidebarOptions);
      fs.writeFileSync(sidebarPath, JSON.stringify(sidebarJson, null, 2));
    }
  });
}
