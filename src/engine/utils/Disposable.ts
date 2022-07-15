export interface IDisposable {
  dispose(): void;
}

export interface IRefCounted {
  addRef(): void;
  release(): boolean;
}

export interface DisposeBag {
  add(disposable: IDisposable): void;
  dispose(): void;
}

export function createDisposeBag(initialDisposables?: IDisposable[]) {
  const disposables: IDisposable[] = [];

  if (initialDisposables) {
    for (let i = 0; i < initialDisposables.length; i++) {
      const disposable = initialDisposables[i];

      if (disposable.addRef) {
        disposable.addRef();
      }

      disposables.push(disposable);
    }
  }

  return {
    add(disposable: IDisposable) {
      if (disposable.addRef) {
        disposable.addRef();
      }

      disposables.push(disposable);
    },
    dispose() {
      for (let i = 0; i < disposables.length; i++) {
        disposables[i].dispose();
      }
    },
  };
}
