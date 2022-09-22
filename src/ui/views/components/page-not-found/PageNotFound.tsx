import { useNavigate } from "react-router-dom";

import { Button } from "../../../atoms/button/Button";
import { Text } from "../../../atoms/text/Text";
import { CoverScreen } from "../cover-screen/CoverScreen";

export function PageNotFound() {
  const navigate = useNavigate();
  return (
    <CoverScreen className="gap-lg">
      <div className="flex flex-column items-center gap-xs">
        <Text variant="h2" weight="bold">
          Page not found
        </Text>
        <Text color="surface-low">Sorry, the page you're looking for doesn't exist.</Text>
      </div>
      <Button onClick={() => navigate("/")}>Go to Homepage</Button>
    </CoverScreen>
  );
}
