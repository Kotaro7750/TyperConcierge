import React from 'react';
import { constructStyledStringElement } from './utility';

export function RomanPane(props: { information: RomanPaneInformation }) {
  return (
    <div className='row'>
      <div className='col-12 border border-4'>
        {constructStyledStringElement(props.information.romanString, [props.information.currentCursorPosition], props.information.missedPosition)}
      </div>
    </div>
  );
}
