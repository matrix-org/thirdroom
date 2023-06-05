export function ndcX(deviceX: number, deviceWidth: number) {
  return (deviceX / deviceWidth) * 2 - 1;
}

export function ndcY(deviceY: number, deviceHeight: number) {
  return -((deviceY / deviceHeight) * 2 - 1);
}
