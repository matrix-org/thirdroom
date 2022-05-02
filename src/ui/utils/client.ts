import { MatrixClient, createClient, ICreateClientOpts } from "@thirdroom/matrix-js-sdk";

export const defaultHomeserver = "https://matrix.org";

export function waitForSync(client: MatrixClient): Promise<void> {
  console.log("wait for sync");
  return new Promise((resolve, reject) => {
    const initialSyncState = client.getSyncState();

    if (initialSyncState === "PREPARED" || initialSyncState === "SYNCING") {
      console.log("sync done");
      resolve();
      return;
    } else if (initialSyncState === "ERROR") {
      console.log("sync error");
      reject(client.getSyncStateData()?.error);
      return;
    }

    const onSync = (state: any, _old: any, data: any) => {
      if (state === "PREPARED" || state === "SYNCING") {
        console.log("sync done");
        resolve();
        client.removeListener("sync", onSync);
      } else if (state === "ERROR") {
        console.log("sync error");
        reject(data?.error);
        client.removeListener("sync", onSync);
      }
    };
    client.on("sync", onSync);
  });
}

export async function initClient(clientOptions: ICreateClientOpts): Promise<MatrixClient> {
  const client = createClient({
    ...clientOptions,
    useAuthorizationHeader: true,
  });

  await client.startClient({
    // dirty hack to reduce chance of gappy syncs
    // should be fixed by spotting gaps and backpaginating
    initialSyncLimit: 50,
  });

  console.log(client);

  return client;
}
