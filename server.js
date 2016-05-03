var path = require('path');
var slug = require('slug');
var express = require('express')
var morgan = require('morgan');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var request = require('superagent');

// Database
var PouchDB = require('pouchdb');
var db = PouchDB('db');
// API server
var app = express();


// Express server configuration: handle static files, ensure
// that HTTP methods are properly handled, considered that body
// is always JSON and turn it into JS objects and logging.
app.use(express.static(path.join(__dirname + '/')));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(morgan('dev'));


// Here we define the controllers used by the Express server.
var controllers = {

  // Load the application entry point.
  base: {
    index: function (req, res) {
      res.send('My Places API');
    }
  },

  // Operation on places.
  places: {

    // Query the database to return all the places stored in
    // in the database.
    all: function (req, res) {
      var allPlaces = function (doc) {
        if (doc.type === 'place') {
          emit(doc._id, null);
        };
      };

      db.query(allPlaces, {include_docs: true}, function (err, data) {
        if (err) {
          console.log(err);
          res.status(500).send({msg: err});
        } else {
          var result = {
            rows: []
          };
          data.rows.forEach(function (row) {
            result.rows.push(row.doc);
          });
          res.send(result);
        }
      });
    },

    // Create a place from sent body in the database.
    create: function (req, res) {
      var place = req.body;

      if (place === undefined || place.link === undefined) {
        res.status(400).send({msg: 'Place malformed.'});

      } else {
        var id = slug(place.link);
        db.get(id, function (err, doc) {

          if (err && !(err.status === 404)) {
            console.log(err);
            res.status(500).send({msg: err});

          } else if (doc !== undefined) {
            console.log(doc);
            res.status(400).send({msg: 'Place already exists.'});

          } else {
            place.type = 'place';
            place._id = id;
            db.put(place, function (err, place) {

              if (err) {
                console.log(err);
                res.status(500).send({msg: err});

              } else {
                res.send(place);

              }
            });
          }
        });
      }
    },

    // Delete a place with given ID.
    delete: function (req, res) {
      var id = req.params.id;
      db.get(id, function (err, doc) {

        if (err) {
          console.log(err);
          res.status(500).send({msg: err});

        } else if (doc === null) {
          res.status(404).send({msg: 'Place does not exist.'});

        } else {

          db.remove(doc, function (err) {
            if (err) {
              console.log(err);
              res.status(500).send({msg: err});

            } else {
              res.sendStatus(204);
            };

          });
        }
      });
    }
  }

};


// Here we link routes and method to controllers.
app.get('/api', controllers.base.index);
app.get('/api/places', controllers.places.all);
app.post('/api/places', controllers.places.create);
app.delete('/api/places/:id', controllers.places.delete);


// Run the server with proper option (port and IP address binding).
var port = process.env.PORT || 9125;
var host = process.env.HOST || '0.0.0.0';
var server = app.listen(port, host, function () {
  console.log('Example app listening at http://%s:%s', host, port)
});
