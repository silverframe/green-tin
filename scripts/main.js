var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Navigation = ReactRouter.Navigation;
var History = ReactRouter.History;
// var createBrowserHistory = require('history/lib/createBrowserHistory');
import { browserHistory } from 'react-router';

var h = require('./helpers');
import { hashHistory } from 'react-router';

var App = React.createClass({
  render: function(){
    return(
      <div>
        <p>Hello</p>
      </div>
    )
  }
});



ReactDOM.render(<App />, document.getElementById('main'));
