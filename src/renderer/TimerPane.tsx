import React from 'react';

export function TimerPane(props: { elapsedTime: number }): JSX.Element {
  return (
    <div className='row'>
      <div className='col-12 fs-1 border border-4 text-end'>
        {props.elapsedTime.toFixed(2)}
      </div>
    </div>
  );
}
