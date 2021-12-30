import React from 'react';

import { StartSignal } from './StartSignal';

export function ReadyView(props: { countdownTimer: number, startCountdown: () => void }) {
  return (
      <div className='row my-3 mx-0'>
        <div className='col-3'>
          <StartSignal countdownTimer={props.countdownTimer} />
        </div>
        <div className='col-2'>
          <button onClick={props.startCountdown} className='btn btn-lg btn-outline-secondary'>Start</button>
        </div>
      </div>
  );
}
