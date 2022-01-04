import React from 'react';

import { StartSignal } from './StartSignal';
import { SelectDictionaryPane } from './SelectDictionaryPane';

export function ReadyView(props: { isCountdownStarted: boolean, countdownTimer: number, startCountdown: () => void }) {
  return (
    <div className='w-100'>
      {
        props.isCountdownStarted
          ? <div className='position-absolute top-50 start-50 translate-middle vh-50'><StartSignal countdownTimer={props.countdownTimer} /></div>
          :
          (
            <div className='position-absolute top-50 start-50 translate-middle w-50'>
              <SelectDictionaryPane />
              <div className='row d-flex justify-content-center mt-3'>
                <div className='col-6 d-flex justify-content-center'>
                  <button onClick={props.startCountdown} className='btn btn-lg btn-outline-primary'>Start</button>
                </div>
              </div>
            </div>
          )
      }
    </div>
  );
}
