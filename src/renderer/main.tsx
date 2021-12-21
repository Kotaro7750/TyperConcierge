import React from 'react';
import ReactDOM from 'react-dom';

const App = (): JSX.Element => {
  return (
    <div>
      <h1>hello</h1>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
