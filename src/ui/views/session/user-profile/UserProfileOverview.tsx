import { useState, ChangeEvent, FormEvent, useMemo } from "react";

import { Content } from "../../../atoms/content/Content";
import { WindowContent } from "../../components/window/WindowContent";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useStore } from "../../../hooks/useStore";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SettingTile } from "../../components/setting-tile/SettingTile";
import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { ScenePreviewOverlay } from "../../components/scene-preview/ScenePreviewOverlay";
import { Text } from "../../../atoms/text/Text";
import { WindowAside } from "../../components/window/WindowAside";
import { getAvatarHttpUrl, getHttpUrl } from "../../../utils/avatar";
import { Footer } from "../../../atoms/footer/Footer";
import { Button } from "../../../atoms/button/Button";
import { useDebounce } from "../../../hooks/useDebounce";
import { use3DAvatar } from "../../../hooks/use3DAvatar";
import { Edit3DAvatar } from "./Edit3DAvatar";
import "./UserProfileOverview.css";
import { AvatarPicker } from "../../components/avatar-picker/AvatarPicker";
import { useFilePicker } from "../../../hooks/useFilePicker";
import { uploadAttachment } from "../../../utils/matrixUtils";
import { Switch } from "../../../atoms/button/Switch";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { SelectInput } from "../../components/property-panel/SelectInput";
import {
  LOCAL_STORAGE_RENDER_QUALITY,
  RenderQualityOptions,
  RenderQualitySetting,
  RenderQualityToSetting,
} from "../../../../engine/renderer/renderer.common";
import { useMainThreadContext } from "../../../hooks/useMainThread";

export function UserProfileOverview() {
  const { session, platform, profileRoom } = useHydrogen(true);
  const { displayName, avatarUrl } = useStore((state) => state.userProfile);
  const { closeWindow } = useStore((state) => state.overlayWindow);

  const [newDisplayName, setNewDisplayName] = useState(displayName);
  const [authoritativeNetworking, setAuthNetworking] = useState(
    localStorage.getItem("authoritativeNetworking") === "true"
  );
  const [discoverPage, setDiscoverPage] = useLocalStorage("feature_discoverPage", false);
  const [immersiveAR, setImmersiveAR] = useLocalStorage("feature_immersiveAR", false);
  const [renderQuality, setRenderQuality] = useLocalStorage(LOCAL_STORAGE_RENDER_QUALITY, RenderQualitySetting.Auto);

  const mainThread = useMainThreadContext();

  const renderQualityOptions = useMemo(() => {
    const currentQuality = RenderQualityOptions.find(
      (option) => option.value === RenderQualityToSetting[mainThread.quality]
    );
    return [{ value: RenderQualitySetting.Auto, label: `Auto (${currentQuality?.label})` }, ...RenderQualityOptions];
  }, [mainThread.quality]);

  const [, tDAvatarPreviewUrl] = use3DAvatar(profileRoom);

  let httpAvatarUrl = avatarUrl
    ? getAvatarHttpUrl(avatarUrl, 150, platform, session.mediaRepository) ?? undefined
    : undefined;

  const {
    fileData: avatarData,
    pickFile: pickAvatar,
    dropFile: dropAvatar,
    resetUses: resetAvatarUses,
  } = useFilePicker(platform, "image/*");
  const isAvatarChanged = avatarData.dropUsed > 0 || avatarData.pickUsed > 0;
  httpAvatarUrl = isAvatarChanged ? avatarData.url : httpAvatarUrl;

  const debounceDisplayNameChange = useDebounce(setNewDisplayName, { wait: 200 });
  const onDisplayNameChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const name = evt.currentTarget.value.trim();
    debounceDisplayNameChange(name);
  };

  const onAuthoritativeNetworkingChange = (checked: boolean) => {
    setAuthNetworking(checked);
    localStorage.setItem("authoritativeNetworking", checked.toString());
  };

  const handleSubmit = async (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    closeWindow();
    const name = evt.currentTarget.displayName.value.trim() as string;
    if (name !== displayName && name !== "") {
      session.hsApi.setProfileDisplayName(session.userId, name);
    }
    if (isAvatarChanged) {
      let mxc = "";
      if (typeof avatarData.blob === "object") {
        mxc = (await uploadAttachment(session.hsApi, avatarData.blob)) ?? "";
      }
      session.hsApi.setProfileAvatarUrl(session.userId, mxc);
    }
  };
  const handleReset = () => {
    setNewDisplayName(displayName);
    resetAvatarUses();
    closeWindow();
  };

  return (
    <WindowContent
      children={
        <Content
          onSubmit={handleSubmit}
          onReset={handleReset}
          children={
            <Scroll>
              <div className="UserProfileOverview__content">
                <SettingTile label={<Label>Profile Picture</Label>}>
                  <AvatarPicker url={httpAvatarUrl} onAvatarPick={pickAvatar} onAvatarDrop={dropAvatar} />
                </SettingTile>
                <div className="flex gap-lg">
                  <SettingTile className="grow basis-0" label={<Label>Default Display Name</Label>}>
                    <Input name="displayName" onChange={onDisplayNameChange} defaultValue={displayName} required />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
                <div className="flex gap-lg">
                  <SettingTile className="grow basis-0" label={<Label>Graphics Quality (REQUIRES REFRESH)</Label>}>
                    <SelectInput options={renderQualityOptions} value={renderQuality} onChange={setRenderQuality} />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
                <div className="flex gap-lg">
                  <SettingTile
                    className="grow basis-0"
                    label={<Label>Authoritative Networking (EXPERIMENTAL, REQUIRES REFRESH)</Label>}
                  >
                    <Switch
                      checked={authoritativeNetworking}
                      onCheckedChange={onAuthoritativeNetworkingChange}
                      defaultChecked={authoritativeNetworking}
                    />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
                <div className="flex gap-lg">
                  <SettingTile className="grow basis-0" label={<Label>Discover Page (REQUIRES REFRESH)</Label>}>
                    <Switch checked={discoverPage} onCheckedChange={setDiscoverPage} />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
                <div className="flex gap-lg">
                  <SettingTile
                    className="grow basis-0"
                    label={<Label>Immersive AR (EXPERIMENTAL, REQUIRES REFRESH)</Label>}
                  >
                    <Switch checked={immersiveAR} onCheckedChange={setImmersiveAR} />
                  </SettingTile>
                  <span className="grow basis-0" />
                </div>
              </div>
            </Scroll>
          }
          bottom={
            (displayName !== newDisplayName || isAvatarChanged) && (
              <Footer
                left={
                  <Button fill="outline" type="reset">
                    Cancel
                  </Button>
                }
                right={<Button type="submit">Save</Button>}
              />
            )
          }
        />
      }
      aside={
        <WindowAside className="flex">
          <ScenePreviewOverlay
            className="grow flex"
            overlay={
              /* DISABLED FEATURE */
              false && (
                <Content
                  className="grow"
                  children=" "
                  bottom={
                    <Footer
                      center={
                        <Edit3DAvatar
                          renderTrigger={(openModal) => (
                            <Button onClick={openModal}>
                              {tDAvatarPreviewUrl ? "Edit 3D Avatar" : "Upload 3D Avatar"}
                            </Button>
                          )}
                        />
                      }
                    />
                  }
                />
              )
            }
          >
            <ScenePreview
              className="grow"
              src={getHttpUrl(session, tDAvatarPreviewUrl)}
              alt="3D Avatar preview"
              fallback={
                /* DISABLED FEATURE */
                false && (
                  <Text variant="b3" color="surface-low" weight="medium">
                    Your 3D avatar preview will appear here.
                  </Text>
                )
              }
            />
          </ScenePreviewOverlay>
        </WindowAside>
      }
    />
  );
}
