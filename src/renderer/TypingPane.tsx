import React, { useEffect } from 'react';
import { RomanPane } from './RomanPane';
import { QueryPane } from './QueryPane';

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
    <>
      <div className='row'>
        <div className='col-12'>
          <RomanPane information={romanPaneInformation} />
        </div>
      </div>
      <div className='row'>
        <div className='col-12'>
          <QueryPane input={props.query.viewString} />
        </div>
      </div>
    </>
  );
}
