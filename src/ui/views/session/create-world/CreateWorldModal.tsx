import { Session } from "@thirdroom/hydrogen-view-sdk";
import { useState } from "react";

import { Content } from "../../../atoms/content/Content";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { ModalAside } from "../../../atoms/modal/ModalAside";
import { ModalContent } from "../../../atoms/modal/ModalContent";
import { Text } from "../../../atoms/text/Text";
import { getHttpUrl } from "../../../utils/avatar";
import { ScenePreview } from "../../components/scene-preview/ScenePreview";
import { CreateWorldForm, CreateWorldFormProps } from "./CreateWorldForm";

export function CreateWorldModal({ session, scene, onCreate, onClose }: { session: Session } & CreateWorldFormProps) {
  const [scenePreviewUrl, setScenePreviewUrl] = useState<string>();

  return (
    <Content className="grow">
      <ModalContent
        children={
          <Content
            top={<Header left={<HeaderTitle>Create World</HeaderTitle>} />}
            children={
              <CreateWorldForm
                scene={scene}
                onSceneChange={(sceneUrl, previewUrl) => setScenePreviewUrl(previewUrl)}
                onCreate={onCreate}
                onClose={onClose}
              />
            }
          />
        }
        aside={
          <ModalAside className="flex">
            <ScenePreview
              className="grow"
              src={getHttpUrl(session, scenePreviewUrl)}
              alt="3D Avatar preview"
              fallback={
                <Text variant="b3" color="surface-low" weight="medium">
                  Uploaded scene preview will appear here.
                </Text>
              }
            />
          </ModalAside>
        }
      />
    </Content>
  );
}
