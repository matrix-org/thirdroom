import { BlobHandle, RequestFunction } from "@thirdroom/hydrogen-view-sdk";

// see https://github.com/matrix-org/rageshake#readme
type RageshakeData = {
  text?: string;
  userAgent: string;
  app: string;
  version: string;
  label?: string;
};

export async function submitLogsToRageshakeServer(
  data: RageshakeData,
  logsBlob: BlobHandle,
  submitUrl: string,
  request: RequestFunction
): Promise<void> {
  const formData = new Map<string, string | { name: string; blob: BlobHandle }>();
  formData.set("user_agent", data.userAgent);
  formData.set("app", data.app);
  formData.set("version", data.version);

  if (data.text) formData.set("text", data.text);
  if (data.label) formData.set("label", data.label);

  formData.set("file", {
    name: "logs.json",
    blob: logsBlob,
  });

  const headers: Map<string, string> = new Map();
  headers.set("Accept", "application/json");

  const result = request(submitUrl, {
    method: "POST",
    body: formData,
    headers,
  });
  let response;
  try {
    response = await result.response();
  } catch (err: any) {
    throw new Error(`Could not submit logs to ${submitUrl}, got error ${err.message}`);
  }
  const { status, body } = response;
  if (status < 200 || status >= 300) {
    throw new Error(`Could not submit logs to ${submitUrl}, got status code ${status} with body ${body}`);
  }
  // we don't bother with reading report_url from the body as the rageshake server doesn't always return it
  // and would have to have CORS setup properly for us to be able to read it.
}
