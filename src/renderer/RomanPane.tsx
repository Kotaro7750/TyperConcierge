import React from 'react';

function constructStyledStringElement(information: RomanPaneInformation): JSX.Element {
  const romanString = information.romanString;
  const cursorPosition = information.currentCursorPosition;
  const missPositionDict: { [key: number]: boolean } = {};

  information.missedPosition.forEach(position => {
    missPositionDict[position] = true;
  });

  let element: JSX.Element[] = [];

  for (let i = 0; i < romanString.length; ++i) {
    let cssClass;
    if (i in missPositionDict) {
      cssClass = 'text-danger';
    } else if (i < cursorPosition) {
      cssClass = 'text-secondary';
    } else if (i == cursorPosition) {
      cssClass = 'text-primary';
    } else {
      cssClass = '';
    }

    element.push(<span key={i} className={cssClass}>{romanString[i]}</span>);
  }

  return (
    <span className='fs-3'>{element}</span>
  )
}

export function RomanPane(props: { information: RomanPaneInformation }) {
  return (
    <div className='row'>
      <div className='col-12 border border-4'>
        {constructStyledStringElement(props.information)}
      </div>
    </div>
  );
}
