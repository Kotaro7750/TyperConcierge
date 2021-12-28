import React from 'react';
import { constructStyledStringElement } from './utility';

function LapLine(props: { styledStringElementList: JSX.Element[] }): JSX.Element {
  return (
    <div className='row'>
      <div className='col-12'>
        <span className='fs-3'>
          {props.styledStringElementList}
        </span>
      </div>
    </div>
  );
}

export function RomanPane(props: { information: RomanPaneInformation }) {
  const styledStringElementList = constructStyledStringElement(props.information.romanString, [props.information.currentCursorPosition], props.information.missedPosition);

  const lapEndPositionDict: { [key: number]: boolean } = {};
  props.information.lapEndPosition.forEach(position => {
    lapEndPositionDict[position] = true;
  });

  const element: JSX.Element[] = [];
  let tmpElement: JSX.Element[] = [];

  styledStringElementList.forEach((elem, i) => {
    tmpElement.push(elem);
    if (i in lapEndPositionDict) {
      element.push(<LapLine key={element.length} styledStringElementList={tmpElement} />);
      tmpElement = [];
    }
  });

  if (tmpElement.length != 0) {
    element.push(<LapLine key={element.length} styledStringElementList={tmpElement} />);
  }

  return (
    <div className='row'>
      <div className='col-12 border border-4'>
        {element}
      </div>
    </div>
  );
}
