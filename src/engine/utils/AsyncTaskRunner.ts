interface AsyncTask {
  id: string | number;
  awaitingPromise: boolean;
  generator: Generator<Promise<unknown>>;
  abortController: AbortController;
  nextValue?: unknown;
  nextError?: unknown;
}

export function createAsyncTaskRunner() {
  const tasks: AsyncTask[] = [];

  return {
    add<A, T>(id: string | number, args: A, task: (args: A, signal: AbortSignal) => Generator<Promise<T>, void, T>) {
      const index = tasks.findIndex((task) => task.id === id);

      if (index !== -1) {
        throw new Error(`Task with id ${id} already exists`);
      }

      const abortController = new AbortController();
      const generator = task(args, abortController.signal);

      tasks.push({
        id,
        awaitingPromise: false,
        generator,
        abortController,
      });
    },
    remove(id: string | number) {
      const index = tasks.findIndex((task) => task.id === id);

      if (index !== -1) {
        const task = tasks[index];
        task.abortController.abort();
        tasks.splice(index, 1);
      }
    },
    update() {
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        if (task.awaitingPromise) {
          continue;
        } else {
          let result: IteratorResult<Promise<unknown>>;

          if (task.nextError) {
            result = task.generator.throw(task.nextError);
            task.nextError = undefined;
          } else {
            result = task.generator.next(task.nextValue);
            task.nextValue = undefined;
          }

          if (result.done) {
            tasks.splice(i, 1);
            i--;
            continue;
          }

          result.value
            .then((value: unknown) => {
              task.nextValue = value;
              task.awaitingPromise = false;
              task.awaitingPromise = false;
            })
            .catch((error: unknown) => {
              task.nextError = error;
              task.awaitingPromise = false;
            });

          task.awaitingPromise = true;
        }
      }
    },
  };
}

export function createSingletonTaskRunner() {
  const taskRunner = createAsyncTaskRunner();

  return {
    run<A, T>(args: A, task: (args: A, signal: AbortSignal) => Generator<Promise<T>, void, T>) {
      taskRunner.remove(0);
      taskRunner.add(0, args, task);
    },
    cancel() {
      taskRunner.remove(0);
    },
    update() {
      taskRunner.update();
    },
  };
}
