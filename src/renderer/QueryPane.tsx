import React from 'react';

export function QueryPane(props: { input: string }): JSX.Element {
  return (
    <div className='row'>
      <div className='col-12 border border-4 fs-3'>
        {props.input}
      </div>
    </div>
  )
}
