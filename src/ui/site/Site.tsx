import { NavLink } from "react-router-dom";

import { Text } from "../atoms/text/Text";

export default function Site() {
  return (
    <div>
      <Text>Hello, World!</Text>
      <NavLink to="/login">Login</NavLink>
    </div>
  );
}
