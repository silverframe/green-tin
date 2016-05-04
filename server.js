var path = require('path');
var slug = require('slug');
var express = require('express')
var morgan = require('morgan');
// var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var request = require('superagent');
var busBoy = require('connect-busboy');
// Database
var PouchDB = require('pouchdb');
var db = PouchDB('db');
// API server
var app = express();
var fs = require('fs');
var path = require('path');


// Express server configuration: handle static files, ensure
// that HTTP methods are properly handled, considered that body
// is always JSON and turn it into JS objects and logging.
app.use(express.static(path.join(__dirname + '/')));
app.use(methodOverride());
app.use(busBoy());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended : true}));
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
        emit(doc._id, null);
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
      if (req.busboy) {

        var locationName = "";
        var shortDescription = "";
        var lat = "";
        var lng = "";

        var imagePath = "";

        req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
          console.log("on file", fieldname, filename, file);

          //save to the local fs
          var saveTo = path.join("./images", path.basename(filename));
          file.pipe(fs.createWriteStream(saveTo));

          imagePath = saveTo;
        });
        req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
          console.log("on field", key, value);
          if (key === "location") {
            locationName = value;
          }
          if (key === "shortDescription") {
            shortDescription = value;
          }
          if (key === "lat") {
            lat = value;
          }
          if (key === "lng") {
            lng = value;
          }
        });
        req.busboy.on('finish', function() {
          console.log("on finish");

          var place = {
            location: locationName,
            shortDescription: shortDescription,
            image: imagePath,
            lat: lat,
            lng: lng 
          };
          console.log(place);
          if (locationName === "") {
            res.status(400).send({msg: 'Location name cannot be empty.'});
          } else {
            var id = slug(place.location);
            db.get(id, function (err, doc) {

              if (err && !(err.status === 404)) {
                console.log(err);
                res.status(500).send({msg: err});

              } else if (doc !== undefined) {
                console.log(doc);
                res.status(400).send({msg: 'Place already exists.'});

              } else {
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
        });
        req.pipe(req.busboy);
      }
    },

    // Delete a place with given ID.
    delete: function (req, res) {
      var id = req.params.id;
      console.log("DELETE THIS ID", id);
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
