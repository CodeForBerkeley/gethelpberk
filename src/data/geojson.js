define(function(require, exports, module) {
  'use strict';
  var flight = require('flight');
  var Tabletop = require('Tabletop');
  var _ = require('lodash');

  module.exports = flight.component(function loader() {
    this.onConfig = function onConfig() {
      // load the geojson
      Tabletop.init( {
        // key: '1oWIrEg77ZSOiYGUA6H4b1wlvtC8pIrvdznQDcbLEUPg',
        key: '1EgPq_wHfWuiNJb_i4UGnbUQzIlgDGxz20pSYOCGIdbg',
        callback: function(data) {
          var facetTitles = data.splice(0, 1)[0];
          // throw away survey rows
          data.splice(0, 2);
          this.trigger('facetTitles', facetTitles);
          this.trigger('data', this.processData(this.csvToGeojson(data)));
        }.bind(this),
        simpleSheet: true
      });
    };

    this.csvRowToProperties = function csvRowToProperties(csvRow, facetValues) {
      var properties = {
        "organization_name": csvRow.organization_name,
        "phone_numbers": csvRow.phone_numbers,
        "address": csvRow.address + " " + csvRow.city + ", California",
        "city": csvRow.city,
        "county": csvRow.county,
        "web_url": csvRow.web_url,
        "hours": csvRow.hours,  // delete this?
        "additional_notes": csvRow.additional_notes
      };

      _.each(facetValues, function(facet, facetValue) {
        if (! properties[facet])  { properties[facet] = []; }
        if (csvRow[facetValue] === "1") {
          properties[facet].push(facetValue);
        }
      });
      return properties;
    };

    this.csvRowToFeature = function csvRowToFeature(csvRow, facetValues) {
      return {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            csvRow.lng,
            csvRow.lat
          ]
        },
        "properties": this.csvRowToProperties(csvRow, facetValues)
      };
    };

    this.csvToGeojson = function csvToGeojson(csv) {
      var facetValues = {
        shelter: "facility_type",
        meals: "food",
        food_bank: "food",
        healthcare: "facility_type",
        gender_male: "gender",
        gender_female: "gender",
        age_child: "age",
        age_adult: "age",
        county: "county"
      };
      csv = _.filter(csv, function(row) {
        return row.organization_name !== "";
      });
      var features = _.map(csv, function(row) {
        return this.csvRowToFeature(row, facetValues);
      }.bind(this));

      return {
        "type": "FeatureCollection",
        "features": features
      };
    };

    this.processData = function processData(data) {
      // give each feature an string ID if it doesn't have one already
      data.features.forEach(function(feature, index) {
        if (!feature.id) {
          feature.id = 'finda-' + index;
        } else {
          feature.id = feature.id.toString();
        }
      });
      return data;
    };

    this.after('initialize', function() {
      // load the data
      this.on(document, 'config', this.onConfig);
    });
  });
});
