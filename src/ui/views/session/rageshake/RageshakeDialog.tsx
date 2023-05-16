import { IBlobHandle, Platform, submitLogsToRageshakeServer } from "@thirdroom/hydrogen-view-sdk";
import React, { FormEventHandler } from "react";

import { Text } from "../../../atoms/text/Text";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { IconButton } from "../../../atoms/button/IconButton";
import CrossIC from "../../../../../res/ic/cross.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Label } from "../../../atoms/text/Label";
import { Button } from "../../../atoms/button/Button";
import { Dots } from "../../../atoms/loading/Dots";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";
import { saveData } from "../../../utils/common";
import { Textarea } from "../../../atoms/input/Textarea";

const getLogs = async (platform: Platform): Promise<IBlobHandle> => {
  const exportReporter = platform.logger.reporters.find((r) => typeof r.export === "function");
  if (!exportReporter) {
    throw new Error("No logger that can export configured");
  }
  const logExport = await exportReporter.export();
  const logs = logExport.asBlob() as IBlobHandle;
  return logs;
};

interface RageshakeDialogProps {
  open: boolean;
  requestClose: () => void;
}

export function RageshakeDialog({ open, requestClose }: RageshakeDialogProps) {
  const { platform, session } = useHydrogen(true);

  const {
    callback: submitLogs,
    loading: submitting,
    error,
  } = useAsyncCallback(async (text?: string) => {
    const { bugReportEndpointUrl } = platform.config;
    if (!bugReportEndpointUrl) {
      throw new Error("No server configured to submit logs");
    }

    const logs = await getLogs(platform);
    await submitLogsToRageshakeServer(
      {
        app: "thirdroom",
        userAgent: platform.description,
        version: platform.version,
        text: `Third Room user ${session.userId} on device ${session.deviceId}: ${text ?? "No description provided."}`,
      },
      logs,
      bugReportEndpointUrl,
      platform.request
    );
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();

    const { descInput } = evt.target as typeof evt.target & { descInput: HTMLInputElement };
    const desc = descInput.value.trim() || undefined;
    descInput.value = "";
    submitLogs(desc);
  };

  const downloadLogs = async () => {
    getLogs(platform).then((outputBlob) => {
      saveData(outputBlob.nativeBlob, `thirdroom-logs-${new Date()}.json`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <Header
        left={<HeaderTitle size="lg">Report Bug</HeaderTitle>}
        right={<IconButton iconSrc={CrossIC} onClick={requestClose} label="Close" />}
      />
      <form
        onSubmit={handleSubmit}
        className="flex flex-column gap-md"
        style={{ padding: "0 var(--sp-md) var(--sp-md)" }}
      >
        <Text variant="b3">
          {"Please "}
          <a href="https://github.com/matrix-org/thirdroom/issues" target="_blank">
            view existing bugs on Github
          </a>
          {" first. No match? "}
          <a href="https://github.com/matrix-org/thirdroom/issues/new" target="_blank">
            Start a new one
          </a>
          .
        </Text>
        <div className="flex flex-column gap-xxs">
          <Text weight="bold">Submit Debug Logs</Text>
          <Text variant="b3">
            Debug logs contain application usage data including your username, the IDs or aliases of the rooms or groups
            you have visited, the usernames of other users and the names of files you send. They do not contain
            messages. For more information, review our{" "}
            <a href="https://element.io/privacy" target="_blank">
              privacy policy
            </a>
            .
          </Text>
        </div>
        <SettingTile label={<Label>Description</Label>}>
          <div className="flex flex-column gap-xxs">
            <Textarea style={{ height: "100px" }} name="descInput" disabled={submitting} />
            {error && (
              <Text variant="b3" color="danger">
                {error.message || "Failed to submit logs."}
              </Text>
            )}
          </div>
        </SettingTile>
        <div className="flex flex-column gap-sm">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Dots color="on-primary" /> : "Submit Logs"}
          </Button>
          <Button type="button" onClick={downloadLogs} fill="outline">
            Download Logs
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
