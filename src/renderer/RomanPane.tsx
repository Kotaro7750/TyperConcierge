import React from 'react';

function constructStyledStringElement(input: string, cursorPosition: number) {
  let element: JSX.Element[] = [];

  for (let i = 0; i < input.length; ++i) {
    let cssClass;
    if (i < cursorPosition) {
      cssClass = 'text-secondary'
    } else if (i == cursorPosition) {
      cssClass = 'text-primary'
    } else {
      cssClass = ''
    }

    element.push(<span key={i} className={cssClass}>{input[i]}</span>);
  }

  return (
    <span className='fs-3'>{element}</span>
  )
}

export function RomanPane(props: { information: RomanPaneInformation }) {
  const romanString: string = props.information.romanString;

  return (
    <div className='row'>
      <div className='col-12 border border-4'>
        {constructStyledStringElement(romanString, props.information.currentCursorPosition)}
      </div>
    </div>
  );
}
