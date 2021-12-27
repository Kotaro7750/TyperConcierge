import React from 'react';
import { constructStyledStringElement } from './utility';

export function QueryPane(props: { input: QueryInformation, information: QuerySentencePaneInformation }): JSX.Element {
  const queryInformation = props.input;
  const querySentencePaneInformation = props.information;

  const viewStringCursorPosition = queryInformation.viewStringPositionOfHiraganaString[querySentencePaneInformation.hiraganaCursorPosition];
  const viewStringMissedPosition = querySentencePaneInformation.missedPosition.map(position => queryInformation.viewStringPositionOfHiraganaString[position]);

  return (
    <div className='row'>
      <div className='col-12 border border-4 fs-3'>
        {constructStyledStringElement(queryInformation.viewString, viewStringCursorPosition, viewStringMissedPosition)}
      </div>
    </div>
  )
}
