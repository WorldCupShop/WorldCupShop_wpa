import React from 'react';
import logo from './logo.svg';
import './App.css';
import { Card } from './components/atoms/Card/Card';
import { Switch } from './components/atoms/switch/Switch';

global.useState = React.useState

function App() {
  var [toggle, setToggle] = React.useState(false);

  return (
    <div className="App">
    </div>
  );
}

export default App;
