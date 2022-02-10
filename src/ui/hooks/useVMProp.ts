import { useState, useEffect } from 'react';

import { ViewModel } from 'hydrogen-view-sdk';

export function useVMProp(vm: typeof ViewModel, propName: string) {
  const [prop, setProp] = useState(vm[propName]);

  useEffect(() => {
    const dispose = vm.disposableOn('change', (changedProp: string) => {
      if (changedProp !== propName) return;
      // TODO: check if prop has changed or not.
      setProp(changedProp);
    });
    return () => dispose();
  }, [vm, propName]);

  return prop;
}
