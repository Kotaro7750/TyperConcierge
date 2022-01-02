import React from 'react';
import ReactDOM from 'react-dom';
//import 'bootstrap/dist/css/bootstrap.min.css';
import './scss/bootstrap-custom.scss';
import 'bootstrap-icons/font/bootstrap-icons.css'

import { Tooltip } from 'bootstrap';

// ツールチップの初期化
let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
let tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
  return new Tooltip(tooltipTriggerEl)
})

import { App } from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
