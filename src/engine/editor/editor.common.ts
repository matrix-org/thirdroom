export interface Selection {
  entities: number[];
  components: number[];
}

export enum EditorEventType {
  EditorLoaded = "editor-loaded",
  SelectionChanged = "selection-changed",
  ComponentInfoChanged = "component-info-changed",
  ComponentPropertyChanged = "component-property-changed",
}
