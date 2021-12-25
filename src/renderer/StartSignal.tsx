import React from 'react';

export function StartSignal(props: { countdownTimer: number }): JSX.Element {
  const circleCSSProperty: React.CSSProperties = {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
  };

  const redCircleCSSProperty: React.CSSProperties = {
    ...circleCSSProperty,
    backgroundColor: '#dc3545',
  }

  const whiteCircleCSSProperty: React.CSSProperties = {
    ...circleCSSProperty,
    backgroundColor: 'white',
  }

  const SIGNAL_COUNT = 3;
  let circles: JSX.Element[] = [];
  for (let i = 0; i < SIGNAL_COUNT; ++i) {
    let style: React.CSSProperties;
    if (i < SIGNAL_COUNT - props.countdownTimer) {
      style = whiteCircleCSSProperty;
    } else {
      style = redCircleCSSProperty;
    }

    circles.push(<div key={i} style={style} className='d-inline-block'><span></span></div>);
  }

  return (
    <div className='row'>
      {circles}
    </div>
  );
}
