import { useLocation, useParams } from "react-router-dom";

export function useWorldId() {
  const { hash } = useLocation();
  const { worldId } = useParams();
  return worldId || hash;
}
