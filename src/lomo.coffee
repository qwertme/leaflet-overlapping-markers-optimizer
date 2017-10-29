class @OverlappingMarkerOptimizer
  constructor: (@map, @markers, opts = {}) ->
    this.legWeight = 2
    this.legColors = { 'usual': {}, 'highlighted': {} }
    this['legColors']['usual'] = '#000000'
    this['legColors']['highlighted'] = '#E53E55'


  makeHighlightListeners: (marker) =>
    {
      highlight: =>
        marker['_omsData'].leg.setStyle color: this.legColors.highlighted
      unhighlight: =>
        marker['_omsData'].leg.setStyle color: this.legColors.usual
    }

  sortMarkersByX: (markers) ->
    x1_array = []
    x2_array = []
    centerX = @map.getCenter().lng
    i = 0
    while i < markers.length
      marker = markers[i]
      if marker.getLatLng().lng < centerX
        x1_array.push marker
      else
        x2_array.push marker
      ++i
    [x1_array, x2_array]

  sortMarkersByY: (markers) ->
    markers.sort (a, b) ->
      b.getLatLng().lat - a.getLatLng().lat

  pullMarkers: (markers, side) ->
    maxY = @map.getPixelBounds().max.y
    minX = @map.latLngToLayerPoint(L.latLng([0, 0])).x
    maxX = @map.getPixelBounds().max.x
    i = 0
    while i < markers.length
      marker = markers[i]
      if side == 'left'
        groupX = minX - 5
        anchorPosition = 90
      else
        groupX = maxX + 5
        anchorPosition = 0
      pt = new (L.Point)(groupX, 23 + maxY + 50 * i)
      footLl = @map.containerPointToLatLng(pt)

      leg = new (L.Polyline)([
        marker.getLatLng()
        footLl
      ],
        color: @['legColors']['usual']
        weight: @['legWeight']
        dashArray: '5, 5'
        tags: marker.options.tags
        clickable: false)
      @map.addLayer leg

      circle = L.circle(marker.getLatLng(),
        radius: 3
        color: '#89CFF0'
        fillColor: '#89CFF0'
        fillOpacity: 1
        interactive: false
        className: 'leaflet-lomo-circle'
        tags: marker.options.tags
      )
      circle.addTo(@map)

      marker['_omsData'] =
        usualPosition: marker.getLatLng()
        leg: leg
        circle: circle
      if @legColors['highlighted'] != @['legColors']['usual']
        mhl = @makeHighlightListeners(marker)
        marker['_omsData'].highlightListeners = mhl

        marker.addEventListener 'mouseover', mhl.highlight
        marker.addEventListener 'mouseout', mhl.unhighlight


      icon_options = marker.options.icon.options
      icon_options.iconAnchor = [anchorPosition, 8]
      icon = L.divIcon icon_options

      marker.setIcon icon
      marker.setLatLng footLl
      ++i

  optimize: ->
    xGroups = @sortMarkersByX(@markers)
    markersX1 = xGroups[0]
    markersX2 = xGroups[1]

    sortedX1Markers = @sortMarkersByY(markersX1)
    sortedX2Markers = @sortMarkersByY(markersX2)

    @pullMarkers sortedX1Markers, 'left'
    @pullMarkers sortedX2Markers, 'right'
    @optimized = true

  restore: ->
    if @optimized == null
      return this

    _ref = @markers
    _i = 0
    _len = _ref.length
    while _i < _len
      marker = _ref[_i]
      if marker['_omsData'] != null
        @map.removeLayer marker['_omsData'].leg
        @map.removeLayer marker['_omsData'].circle

        marker.setLatLng marker['_omsData'].usualPosition
        marker.setZIndexOffset 0
        mhl = marker['_omsData'].highlightListeners
        if mhl != null
          marker.removeEventListener 'mouseover', mhl.highlight
          marker.removeEventListener 'mouseout', mhl.unhighlight
        delete marker['_omsData']
      _i++
    delete @optimized
    this
