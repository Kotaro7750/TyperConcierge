import React from 'react';

import { StartSignal } from './StartSignal';

export function ReadyView(props: { isCountdownStarted: boolean, countdownTimer: number, startCountdown: () => void }) {
  return (
    <div className='w-100'>
      {
        props.isCountdownStarted
          ? <div className='position-absolute top-50 start-50 translate-middle vh-50'><StartSignal countdownTimer={props.countdownTimer} /></div>
          : <div className='position-absolute top-50 start-50 translate-middle'><button onClick={props.startCountdown} className='btn btn-lg btn-outline-primary'>Start</button></div>
      }
    </div>
  );
}
