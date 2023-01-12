import { useMemo } from "react";

export function useOrderString() {
  return useMemo(() => {
    const LOWER_CHAR = " ";
    const UPPER_CHAR = "~";
    const MAX_STR_LEN = 6;

    const getMidStr = () => "NNNOOO";

    const validStr = (str: string) => {
      if (typeof str !== "string" || str === "") return false;
      if (str.length > MAX_STR_LEN) return false;
      for (let charIndex = 0; charIndex < str.length; charIndex = charIndex + 1) {
        const charCode = str.charCodeAt(charIndex);
        if (charCode < LOWER_CHAR.charCodeAt(0) || charCode > UPPER_CHAR.charCodeAt(0)) return false;
      }
      return true;
    };

    /**
     * To generate previous string in lexicographical order
     */
    const getPrevStr = (str: string): string | null => {
      if (!validStr(str)) return null;
      let newStr = str;
      const charIndex = newStr.length - 1;
      const charCode = newStr.charCodeAt(charIndex);

      if (charCode === LOWER_CHAR.charCodeAt(0)) {
        newStr = newStr.slice(0, charIndex);
        if (newStr.length === 0) return null;
        return newStr;
      }

      newStr = newStr.slice(0, charIndex) + String.fromCharCode(charCode - 1);
      while (newStr.length < MAX_STR_LEN) newStr = newStr + UPPER_CHAR;
      return newStr;
    };

    /**
     * To generate next string in lexicographical order
     */
    const getNextStr = (str: string): string | null => {
      if (!validStr(str)) return null;
      let newStr = str;

      if (newStr.length < MAX_STR_LEN) {
        newStr = newStr + LOWER_CHAR;
        return newStr;
      }

      for (let charIndex = newStr.length - 1; charIndex >= 0; charIndex = charIndex - 1) {
        const charCode = newStr.charCodeAt(charIndex);
        if (charCode !== UPPER_CHAR.charCodeAt(0)) {
          newStr = newStr.slice(0, charIndex) + String.fromCharCode(charCode + 1);
          return newStr;
        }
        newStr = newStr.slice(0, charIndex);
      }
      return null;
    };

    return {
      getMidStr,
      validStr,
      getPrevStr,
      getNextStr,
    };
  }, []);
}
