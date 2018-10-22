class OverlappingMarkerOptimizer {
  constructor(map, markers, opts) {
    this.makeHighlightListeners = this.makeHighlightListeners.bind(this);
    this.map = map;
    this.markers = markers;
    if (opts == null) { opts = {}; }
    this.legWeight = 2;
    this.legColors = { 'usual': {}, 'highlighted': {} };
    this['legColors']['usual'] = '#000000';
    this['legColors']['highlighted'] = '#E53E55';
  }


  makeHighlightListeners(marker) {
    return {
      highlight: () => {
        return marker['_omsData'].leg.setStyle({color: this.legColors.highlighted});
      },
      unhighlight: () => {
        return marker['_omsData'].leg.setStyle({color: this.legColors.usual});
      }
    };
  }

  sortMarkersByX(markers) {
    const x1_array = [];
    const x2_array = [];
    const centerX = this.map.getCenter().lng;
    let i = 0;
    while (i < markers.length) {
      const marker = markers[i];
      if (marker.getLatLng().lng < centerX) {
        x1_array.push(marker);
      } else {
        x2_array.push(marker);
      }
      ++i;
    }
    return [x1_array, x2_array];
  }

  sortMarkersByY(markers) {
    return markers.sort((a, b) => b.getLatLng().lat - a.getLatLng().lat);
  }

  pullMarkers(markers, side) {
    const maxY = this.map.getPixelBounds().max.y;
    const minX = this.map.latLngToLayerPoint(L.latLng([0, 0])).x;
    const maxX = this.map.getPixelBounds().max.x;
    let i = 0;
    return (() => {
      const result = [];
      while (i < markers.length) {
        var anchorPosition, groupX;
        const marker = markers[i];
        if (side === 'left') {
          groupX = minX - 5;
          anchorPosition = 90;
        } else {
          groupX = maxX + 5;
          anchorPosition = 0;
        }
        const pt = new (L.Point)(groupX, 23 + maxY + (50 * i));
        const footLl = this.map.containerPointToLatLng(pt);

        const leg = new (L.Polyline)([
          marker.getLatLng(),
          footLl
        ], {
          color: this['legColors']['usual'],
          weight: this['legWeight'],
          dashArray: '5, 5',
          tags: marker.options.tags,
          clickable: false
        });
        this.map.addLayer(leg);

        const circle = L.circle(marker.getLatLng(), {
          radius: 3,
          color: '#89CFF0',
          fillColor: '#89CFF0',
          fillOpacity: 1,
          interactive: false,
          className: 'leaflet-lomo-circle',
          tags: marker.options.tags
        }
        );
        circle.addTo(this.map);

        marker['_omsData'] = {
          usualPosition: marker.getLatLng(),
          leg,
          circle
        };
        if (this.legColors['highlighted'] !== this['legColors']['usual']) {
          const mhl = this.makeHighlightListeners(marker);
          marker['_omsData'].highlightListeners = mhl;

          marker.addEventListener('mouseover', mhl.highlight);
          marker.addEventListener('mouseout', mhl.unhighlight);
        }


        const icon_options = marker.options.icon.options;
        icon_options.iconAnchor = [anchorPosition, 8];
        const icon = L.divIcon(icon_options);

        marker.setIcon(icon);
        marker.setLatLng(footLl);
        result.push(++i);
      }
      return result;
    })();
  }

  optimize() {
    const xGroups = this.sortMarkersByX(this.markers);
    const markersX1 = xGroups[0];
    const markersX2 = xGroups[1];

    const sortedX1Markers = this.sortMarkersByY(markersX1);
    const sortedX2Markers = this.sortMarkersByY(markersX2);

    this.pullMarkers(sortedX1Markers, 'left');
    this.pullMarkers(sortedX2Markers, 'right');
    return this.optimized = true;
  }

  restore() {
    if (this.optimized === null) {
      return this;
    }

    const _ref = this.markers;
    let _i = 0;
    const _len = _ref.length;
    while (_i < _len) {
      const marker = _ref[_i];
      if (marker['_omsData'] !== null) {
        this.map.removeLayer(marker['_omsData'].leg);
        this.map.removeLayer(marker['_omsData'].circle);

        marker.setLatLng(marker['_omsData'].usualPosition);
        marker.setZIndexOffset(0);
        const mhl = marker['_omsData'].highlightListeners;
        if (mhl !== null) {
          marker.removeEventListener('mouseover', mhl.highlight);
          marker.removeEventListener('mouseout', mhl.unhighlight);
        }
        delete marker['_omsData'];
      }
      _i++;
    }
    delete this.optimized;
    return this;
  }
};

export { OverlappingMarkerOptimizer as default }
