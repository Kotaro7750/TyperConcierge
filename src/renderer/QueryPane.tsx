import _ from 'react';
import { constructStyledStringElement } from './utility';

export function QueryPane(props: { queryInfo: QueryInfo, paneInfo: QuerySentencePaneInfo }): JSX.Element {
  const queryInfo = props.queryInfo;
  const querySentencePaneInfo = props.paneInfo;

  // カーソル・ミス・指定字数内の最後の表示分での位置を計算する
  const viewStrCursorPos = querySentencePaneInfo.hiraganaCursorPos.map(i => queryInfo.viewStringPosOfHiraganaString[i]);
  const viewStrMissedPos = querySentencePaneInfo.hiraganaMissedPos.map(pos => queryInfo.viewStringPosOfHiraganaString[pos]);
  const viewStrLastPos = queryInfo.viewStringPosOfHiraganaString[querySentencePaneInfo.hiraganaLastPos];

  return (
    <div className='row'>
      <div className='col-12 border border-secondary border-3 rounded-3 fs-3 bg-white vh-30'>
        {constructStyledStringElement(queryInfo.viewString, viewStrCursorPos, viewStrMissedPos,viewStrLastPos)}
      </div>
    </div>
  )
}
