import React, { useEffect } from 'react';
import { RomanPane } from './RomanPane';

import { useRomanEngine } from './useRomanEngine';

export function TypingPane(props: { query: QueryString }) {
  const [romanPaneInformation, handleInput] = useRomanEngine(props.query.romanString);

  useEffect(() => {
    let func = (e: CustomEventInit<PrintableKeyDownEvent>) => {
      if (e.detail !== undefined) {
        handleInput(e.detail.key);
      }
    };

    addEventListener('printableKeydown', func);

    return () => { removeEventListener('printableKeydown', func) }
  });

  return (
    <div>
      <RomanPane information={romanPaneInformation} />
    </div>
  );
}
