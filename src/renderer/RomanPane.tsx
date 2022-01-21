import _ from 'react';
import { constructStyledStringElement } from './utility';

function LapLine(props: { styledStringElementList: JSX.Element[], lapTimeMS: number }): JSX.Element {
  const lapTimeStr = props.lapTimeMS == 0 ? '' : (props.lapTimeMS / 1000).toFixed(3);

  // FIXME 画面を小さくすると折り返されて表示が変になる
  return (
    <div className='row me-0 my-1'>
      <div className='col-11'>
        <span className='fs-3'>
          {props.styledStringElementList}
        </span>
      </div>
      <div className='p-0 d-flex justify-content-center align-items-center col-1 border border-secondary border-2 rounded-3 text-center bg-white'>
        <span className='align-middle'>{lapTimeStr}</span>
      </div>
    </div>
  );
}

export function RomanPane(props: { paneInfo: RomanPaneInfo }) {
  const romanPaneInfo = props.paneInfo;
  const styledStringElementList = constructStyledStringElement(romanPaneInfo.romanStr, [romanPaneInfo.cursorPos], romanPaneInfo.missedPos, romanPaneInfo.romanStr.length - 1);

  // 連想検索をしやすくするためにMapを使う
  const lapEndPosDict = new Map<number, boolean>();
  romanPaneInfo.lapEndPos.forEach(pos => {
    lapEndPosDict.set(pos, true);
  });

  // ラップの情報を基に実際に表示する要素を作る
  const lapLineList: JSX.Element[] = [];
  let inLapLineElem: JSX.Element[] = [];
  let previousLapEndElapsedTime: number = 0;

  styledStringElementList.forEach((elem, i) => {
    inLapLineElem.push(elem);

    // この要素がラップの最後だったら表示要素を構築する
    if (lapEndPosDict.has(i)) {
      const lapIndex = lapLineList.length;
      // ラップタイムは確定してから配列に格納されるのでまだない場合もある
      const lapTimeMS = lapIndex > romanPaneInfo.lapElapsedTime.length - 1 ? 0 : romanPaneInfo.lapElapsedTime[lapIndex] - previousLapEndElapsedTime;

      previousLapEndElapsedTime = romanPaneInfo.lapElapsedTime[lapIndex];
      lapLineList.push(<div className='col-12' key={lapIndex}><LapLine styledStringElementList={inLapLineElem} lapTimeMS={lapTimeMS} /></div>);

      inLapLineElem = [];
    }
  });

  // 飛び出した要素があるなら追加する
  if (inLapLineElem.length != 0) {
    lapLineList.push(<div className='col-12' key={lapLineList.length}><LapLine styledStringElementList={inLapLineElem} lapTimeMS={0} /></div>);
  }

  return (
    <div className='row border border-secondary border-3 rounded-3 bg-white vh-40'>
      {lapLineList}
    </div>
  );
}
