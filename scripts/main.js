var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Navigation = ReactRouter.Navigation;
var History = ReactRouter.History;
var slug = require('slug');
// var createBrowserHistory = require('history/lib/createBrowserHistory');
import { browserHistory } from 'react-router';

var h = require('./helpers');
import { hashHistory } from 'react-router';
var request = require('superagent');

// Helpers to request the server API.
var data = {

  // Get all places stored on the server.
  getPlaces: function(callback) {
    request
      .get('/api/places')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        callback(err, res.body);
      });
  },

  // Creates a place on server. Title and url are required.
  createPlace: function(place, callback) {
    request
      .post('/api/places')
      .send(place)
      .end(function (err, res) {
        callback(err, res.body);
      });
  },

  // Delete a place from the server.
  // Build place id from link by slugifying it.
  deletePlace: function(place, callback) {
    request
      .del('/api/places/' + slug(place.link))
      .end(callback);
  }

}

var App = React.createClass({
  render: function() {
    return (
      <div>
        <h1>Where to Go?</h1>
        <PlaceList places={this.props.places}>
        </PlaceList>
      </div>
    )
  }
});

var Place = React.createClass({

  onDeleteClicked: function() {
   this.props.removeLine(this.props);
 },

 render: function() {
   return (
     <div>
       <p class="title">{this.props.title}</p>
       <p class="link">
         <a href={this.props.link}>{this.props.link}</a>
       </p>
       <p>
         <button onClick={this.onDeleteClicked}>X</button>
       </p>
     </div>
   );
 }
});

var places = [
  {title: "title 01", link: "http://place.com/"},
  {title: "title 02", link: "http://place2.com/"}
];

var PlaceList = React.createClass({
  getInitialState: function() {
    return {places: this.props.places};
  },

  componentWillMount: function() {
    data.getPlaces(function(err, body) {
      this.setState({
       places: body.rows
        });
      }.bind(this));
    },

  onAddClicked: function() {
    var places = this.state.places;
    var title = this.refs.titleInput.value;
    var link = this.refs.linkInput.value;

    var place = {title: title, link: link};
    places.push(place);

    this.setState({places: places});
    data.createPlace(place, function () {});
  },
  removeLine: function(line) {
    var places = this.state.places;
    var index = 0;
    while (index < places.length && places[index].link !== line.link) {
      index++;
    }
    if (index < places.length) {
      var place = places.splice(index, 1)[0];

      this.setState({places: places});
      data.deletePlace(place, function () {});
    }
  },

  render: function() {
    var removeLine = this.removeLine;
    var places = this.state.places.map(function(place) {
      return (
        <Place title={place.title} link={place.link}
                  removeLine={removeLine}>
        </Place>
      );
    });

    return (
      <div>
        <div>
          <label>title</label>
          <input ref="titleInput" type="text" ></input>
        </div>
        <div>
          <label>url</label>
          <input ref="linkInput" type="text"></input>
        </div>
        <div>
          <button onClick={this.onAddClicked}>+</button>
        </div>
        <div>
          {places}
        </div>
      </div>
    );
  }
});


ReactDOM.render(<App places={places}></App>,
             document.getElementById('main'));
