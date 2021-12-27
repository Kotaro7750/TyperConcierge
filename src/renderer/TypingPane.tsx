import React, { useEffect } from 'react';
import { RomanPane } from './RomanPane';
import { QueryPane } from './QueryPane';

import { useRomanEngine } from './useRomanEngine';

export function TypingPane(props: { queryInformation: QueryInformation }) {
  const [sentenceViewPaneInformation, handleInput] = useRomanEngine(props.queryInformation.hiraganaString);

  useEffect(() => {
    let func = (e: CustomEventInit<PrintableKeyDownEvent>) => {
      if (e.detail !== undefined) {
        handleInput(e.detail.key, e.detail.elapsedTime);
      }
    };

    addEventListener('printableKeydown', func);

    return () => { removeEventListener('printableKeydown', func) }
  });

  return (
    <>
      <div className='row'>
        <div className='col-12'>
          <QueryPane input={props.queryInformation} information={sentenceViewPaneInformation.querySentencePaneInforamtion} />
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <RomanPane information={sentenceViewPaneInformation.romanPaneInformation} />
        </div>
      </div>
    </>
  );
}
