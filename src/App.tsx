import React from 'react';
import logo from './logo.svg';
import './App.css';
import { MessageboxProvider } from './lib/messagebox';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { NotFoundPage } from './page/notFoundPage';
import { HomePage } from './page/homePage';

function App() {
  return (
    <MessageboxProvider>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Switch>
          <Route path="/" component={HomePage} exact />
          <Route path="/" component={NotFoundPage} />
        </Switch>
      </BrowserRouter>
  </MessageboxProvider>
  );
}

export default App;
