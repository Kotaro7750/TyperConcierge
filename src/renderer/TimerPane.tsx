import React from 'react';

export function TimerPane(props: { elapsedTime: number }): JSX.Element {
  const elapsedTimeS = props.elapsedTime / 1000;
  return (
    <div className='row'>
      <div className='col-12 fs-1 text-end'>
        <i className='bi bi-stopwatch' /> {elapsedTimeS.toFixed(2)}
      </div>
    </div>
  );
}
