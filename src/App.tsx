import React from 'react';
import logo from './logo.svg';
import './App.css';
import { MessageboxProvider } from './lib/messagebox';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { NotFoundPage } from './page/notFoundPage';
import { HomePage } from './page/homePage';
import { registMocks } from './api';
import { DetailPage } from './page/detailPage';

function App() {
  registMocks();
  return (
    <MessageboxProvider>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <Switch>
          <Route path="/" component={HomePage} exact />
          <Route path="/index.html" component={HomePage} exact />
          <Route path="/mails/" component={DetailPage} />
          <Route path="/" component={NotFoundPage} />
        </Switch>
      </BrowserRouter>
    </MessageboxProvider>
  );
}

export default App;
