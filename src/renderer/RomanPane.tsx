import React from 'react';
import { constructStyledStringElement } from './utility';

function LapLine(props: { styledStringElementList: JSX.Element[], lapTimeMilliSecond: number }): JSX.Element {
  const lapTimeString = props.lapTimeMilliSecond == 0 ? '' : (props.lapTimeMilliSecond / 1000).toFixed(3);

  // FIXME 画面を小さくすると折り返されて表示が変になる
  return (
    <div className='row me-0 my-1'>
      <div className='col-11'>
        <span className='fs-3'>
          {props.styledStringElementList}
        </span>
      </div>
      <div className='col-1 border border-2 text-end'>
        {lapTimeString}
      </div>
    </div>
  );
}

export function RomanPane(props: { information: RomanPaneInformation }) {
  const romanPaneInfo = props.information;
  const styledStringElementList = constructStyledStringElement(romanPaneInfo.romanString, [romanPaneInfo.cursorPos], romanPaneInfo.missedPos);
  const lapEndPositionDict: { [key: number]: boolean } = {};

  romanPaneInfo.lapEndPos.forEach(pos => {
    lapEndPositionDict[pos] = true;
  });

  const lapLineList: JSX.Element[] = [];
  let inLapLineElement: JSX.Element[] = [];
  let previousLapEndElapsedTime: number = 0;

  styledStringElementList.forEach((elem, i) => {
    inLapLineElement.push(elem);
    if (i in lapEndPositionDict) {
      const lapIndex = lapLineList.length;
      // ラップタイムが確定してから配列に格納されるのでまだない場合もある
      const lapTimeMilliSecond = lapIndex > romanPaneInfo.lapElapsedTime.length - 1 ? 0 : romanPaneInfo.lapElapsedTime[lapIndex] - previousLapEndElapsedTime;

      previousLapEndElapsedTime = romanPaneInfo.lapElapsedTime[lapIndex];
      lapLineList.push(<div className='col-12'><LapLine key={lapIndex} styledStringElementList={inLapLineElement} lapTimeMilliSecond={lapTimeMilliSecond} /></div>);

      inLapLineElement = [];
    }
  });

  if (inLapLineElement.length != 0) {
    lapLineList.push(<div className='col-12'><LapLine key={lapLineList.length} styledStringElementList={inLapLineElement} lapTimeMilliSecond={0} /></div>);
  }

  return (
    <div className='row border border-4'>
      {lapLineList}
    </div>
  );
}
