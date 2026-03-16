import { useEffect } from "react";

export const useRealtime = (callback: () => void) => {
  useEffect(() => {
    callback();
  }, [callback]);
};
