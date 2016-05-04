var React = require('react');
var ReactDOM = require('react-dom');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Navigation = ReactRouter.Navigation;
var History = ReactRouter.History;
var slug = require('slug');
var Dropzone = require('react-dropzone');
// var createBrowserHistory = require('history/lib/createBrowserHistory');
import { browserHistory } from 'react-router';

var h = require('./helpers');
import { hashHistory } from 'react-router';
var request = require('superagent');
import Geosuggest from 'react-geosuggest';

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
    console.log('file: ', this.currentFile);
    console.log('hello');
    // var formData = new FormData();
    // formData.append('location', place.location);
    var r = request
      .post('/api/places')
      .field('location', place.location)
      .field('shortDescription', place.shortDescription)
      if (this.currentFile) {
        r = r.attach('image', this.currentFile, this.currentFile.name);
      }

      r.end(function (err, res) {
        callback(err, res.body);
      });
  },

  // Delete a place from the server.
  // Build place id from shortDescription by slugifying it.
  deletePlace: function(place, callback) {
    request
      .del('/api/places/' + slug(place.location))
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
   console.log(this.props)
   var imageStyle = {
     width: "100px",
     height: "100px"
   }
   return (
     <div className="placeBox">
       <p class="location">{this.props.location}</p>
       <p class="shortDescription">
        {this.props.shortDescription}
       </p>
       <img src={this.props.image} style={imageStyle}/>
       <p>
         <button onClick={this.onDeleteClicked}>X</button>
       </p>
     </div>
   );
 }
});

var places = [
  {location: "location 01", shortDescription: "http://place.com/"},
  {location: "location 02", shortDescription: "http://place2.com/"}
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
    var location = this.refs.locationInput.value;
    var shortDescription = this.refs.descriptionInput.value;

    var place = {location: location, shortDescription: shortDescription};
    places.push(place);

    //formData.append('image', this.currentFile);
    this.setState({places: places});
    data.createPlace(place, function () {});
  },
  removeLine: function(line) {
    var places = this.state.places;
    var index = 0;
    while (index < places.length && places[index].shortDescription !== line.shortDescription) {
      index++;
    }
    if (index < places.length) {
      var place = places.splice(index, 1)[0];

      this.setState({places: places});
      data.deletePlace(place, function () {});
    }
  },

  onSuggestSelected: function(suggest) {
    var location = this.refs.locationInput.value;
    var lat = suggest.location.lat;
    var lng = suggest.location.lng;
    var place = {
      location: location,
      lat: lat,
      lng: lng,
    };

    places.push(place);
    this.setState({places: places});

  },

  render: function() {
    var removeLine = this.removeLine;
    var key = 0;
    var places = this.state.places.map(function(place) {
      return (
        <Place key={key++} location={place.location} shortDescription={place.shortDescription} image={place.image}
               removeLine={removeLine}>
        </Place>
      );
    });

    return (
      <div>
        <div>
          <label>Location</label>
          <input ref="locationInput" type="text" ></input>
        </div>
        <div>
          <label>shortDescription</label>
          <input ref="descriptionInput" type="text"></input>
        </div>
        <div>
          <label>Location</label>
          <Geosuggest onSuggestSelect={this.onSuggestSelected}/>
        </div>
        <div>
          <DropzoneDemo />
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

var DropzoneDemo = React.createClass({
    getInitialState: function () {
        return {
          files: []
        };
    },

    onDrop: function (files) {
        data.currentFile = files[0];
    },

    onOpenClick: function () {
      this.refs.dropzone.open();
    },

    render: function () {
        return (
            <div>
                <Dropzone ref="dropzone" onDrop={this.onDrop}>
                    <div>Try dropping some files here, or click to select files to upload.</div>
                </Dropzone>
                <button type="button" onClick={this.onOpenClick}>
                    Open Dropzone
                </button>
                {this.state.files.length > 0 ? <div>
                <h2>Uploading {this.state.files.length} files...</h2>
                <div>{this.state.files.map((file) => <img src={file.preview} /> )}</div>
                </div> : null}
            </div>
        );
    }
});


ReactDOM.render(<div><App places={places}></App></div> ,
             document.getElementById('main'));
