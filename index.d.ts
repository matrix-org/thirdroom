// monaco-vim does not have types, so we create a shallow module definition for our purposes
declare module "monaco-vim" {
  interface VimMode {
    dispose();
  }

  function initVimMode(editor: MonacoEditor.IStandaloneCodeEditor, statusBar: HTMLElement | null): VimMode;
}
