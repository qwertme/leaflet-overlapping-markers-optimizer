(function() {
  var __hasProp = {}.hasOwnProperty,
    __slice = [].slice;

  if (this['L'] == null) {
    return;
  }

  this['OverlappingMarkerSpiderfier'] = (function() {
    var p, twoPi;

    p = _Class.prototype;

    p['VERSION'] = '0.0.1';

    p['legWeight'] = 1.5;

    p['legColors'] = {
      'usual': '#222',
      'highlighted': '#f00'
    };

    function _Class(map, markers, opts) {
      var e, k, v, _i, _len, _ref,
        _this = this;

      this.map = map;
      this.markers = markers;
      console.log('plg');
      console.log(map);
      console.log(markers);
      if (opts == null) {
        opts = {};
      }
      for (k in opts) {
        if (!__hasProp.call(opts, k)) continue;
        v = opts[k];
        this[k] = v;
      }
    }

    p.makeHighlightListeners = function(marker) {
      var _this = this;

      return {
        highlight: function() {
          return marker['_omsData'].leg.setStyle({
            color: _this['legColors']['highlighted']
          });
        },
        unhighlight: function() {
          return marker['_omsData'].leg.setStyle({
            color: _this['legColors']['usual']
          });
        }
      };
    };

    p.sortMarkersByX = function(markers) {
      var x1_array = [];
      var x2_array = [];
      var centerX = this.map.getCenter().lng;

      for (i = 0; i < markers.length; ++i) {
        var marker = markers[i];
        if ( marker.getLatLng().lng < centerX ) {
          x1_array.push(marker);
        } else {
          x2_array.push(marker);
        }
      }

      return [x1_array, x2_array]
    };

    p.sortMarkersByY = function(markers) {
      return markers.sort(function (a, b) {
        return b.getLatLng().lat - a.getLatLng().lat;
      });
    };

    p.pullMarkers = function(markers, side) {
      var maxY = this.map.getPixelBounds().max.y;
      var minX = this.map.latLngToLayerPoint(L.latLng([0, 0])).x

      var maxX = this.map.getPixelBounds().max.x;
      var pt;
      var i;

      console.log(minX);

      for (i = 0; i < markers.length; ++i) {
        var marker = markers[i];

        if ( side == 'left' ) {
          var groupX = minX - 45;
        } else {
          var groupX = maxX + 45;
        }

        var pt = new L.Point(groupX, 23 + maxY + 50 * i);
        var footLl = this.map.containerPointToLatLng(pt);

        var leg = new L.Polyline([marker.getLatLng(), footLl], {
          color: this['legColors']['usual'],
          weight: this['legWeight'],
          clickable: false
        });
        this.map.addLayer(leg);
        marker['_omsData'] = {
          usualPosition: marker.getLatLng(),
          leg: leg
        };
        if (this['legColors']['highlighted'] !== this['legColors']['usual']) {
          mhl = this.makeHighlightListeners(marker);
          marker['_omsData'].highlightListeners = mhl;
          marker.addEventListener('mouseover', mhl.highlight);
          marker.addEventListener('mouseout', mhl.unhighlight);
        }

        marker.setLatLng(footLl);
        // marker.setZIndexOffset(1000000);
      }
    };

    p.spiderfy = function() {
      var xGroups = this.sortMarkersByX(this.markers);
      var markersX1 = xGroups[0];
      var markersX2 = xGroups[1];

      var sortedX1Markers = this.sortMarkersByY(markersX1);
      var sortedX2Markers = this.sortMarkersByY(markersX2);

      this.pullMarkers(sortedX1Markers, 'left');
      this.pullMarkers(sortedX2Markers, 'right');

      this.spiderfied = true;
    };

    p.unspiderfy = function() {
      var marker, mhl, _i, _len, _ref;

      if (this.spiderfied == null) {
        return this;
      }
      this.unspiderfying = true;
      _ref = this.markers;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        if (marker['_omsData'] != null) {
          this.map.removeLayer(marker['_omsData'].leg);
          marker.setLatLng(marker['_omsData'].usualPosition);
          marker.setZIndexOffset(0);
          mhl = marker['_omsData'].highlightListeners;
          if (mhl != null) {
            marker.removeEventListener('mouseover', mhl.highlight);
            marker.removeEventListener('mouseout', mhl.unhighlight);
          }
          delete marker['_omsData'];
        }
      }
      delete this.unspiderfying;
      delete this.spiderfied;
      return this;
    };

    return _Class;

  })();

}).call(this);
