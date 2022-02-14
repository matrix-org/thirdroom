import React from "react";

import { Icon } from "../atoms/icon/Icon";
import { Text } from "../atoms/text/Text";
import { Button } from "../atoms/button/Button";
import { SessionViewModel } from '../../viewModels/SessionViewModel';

import HomeIC from '../../../res/ic/home.svg';

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  return (
    <>
      <p>Session view</p>
      <Icon src={HomeIC} />
      <Text variant="h2" weight="semi-bold">Hello, world</Text>
      <Text variant="s1" weight="semi-bold">Hello, world</Text>
      <Text>Hello, world</Text  >
      <Text variant="b2">Hello, world</Text>
      <Text variant="b3">Hello, world</Text>
      <Button iconSrc={HomeIC} variant="surface" onClick={() => false}>Hello, world</Button>
      <Button iconSrc={HomeIC} variant="primary" onClick={() => false}>Hello, world</Button>
      <Button size="small" iconSrc={HomeIC} variant="primary" onClick={() => false}>Hello, world</Button>
      <Button size="extra-small" iconSrc={HomeIC} variant="primary" onClick={() => false}>Hello, world</Button>
    </>
  );
}
