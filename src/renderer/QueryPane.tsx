import _ from 'react';
import { constructStyledStringElement } from './utility';

export function QueryPane(props: { input: QueryInfo, information: QuerySentencePaneInformation }): JSX.Element {
  const queryInformation = props.input;
  const querySentencePaneInformation = props.information;

  const viewStringCursorPosition = querySentencePaneInformation.hiraganaCursorPosition.map(i => queryInformation.viewStringPosOfHiraganaString[i]);
  const viewStringMissedPosition = querySentencePaneInformation.missedPosition.map(position => queryInformation.viewStringPosOfHiraganaString[position]);

  const viewStrLastPos = queryInformation.viewStringPosOfHiraganaString[querySentencePaneInformation.hiraganaLastPos];

  return (
    <div className='row'>
      <div className='col-12 border border-secondary border-3 rounded-3 fs-3 bg-white vh-30'>
        {constructStyledStringElement(queryInformation.viewString, viewStringCursorPosition, viewStringMissedPosition,viewStrLastPos)}
      </div>
    </div>
  )
}
