import React, { useState, useRef } from 'react'
import { GoogleMap, withGoogleMap, withScriptjs, Polygon } from 'react-google-maps'
import DrawingManager from "react-google-maps/lib/components/drawing/DrawingManager"
import { districts, RIVNE_CENTER } from '../config'
// import { useInterval } from './hooks'

const isInTimeRange = (timeRanges, hour) => {
  return timeRanges.some(([from, to]) => hour >= from && hour < to)
}

const Map = withScriptjs(withGoogleMap(({schedules}) => {

  const [currentHour, setCurrentHour] = useState(new Date().getHours())

  const handleClickDistrict = (key, district, timeRanges) => () => {
    console.log(key, timeRanges)
  }

  const handleCompletePolygon = (polygon) => {
    polygon.getPath().getArray().map((point) => {
      console.log(point.lat(), point.lng())
    })
    // console.log(polygon.getPath().getArray())
  }

  // const updateTime = () => {
  //   setCurrentHour(new Date().getHours())
  // }

  // useInterval(updateTime, 1000)
  return (
    <GoogleMap
      defaultZoom={14}
      defaultCenter={RIVNE_CENTER}>
      {
        Object.entries(districts).map(([key, district], index) => {
          const isPowerOff = isInTimeRange(schedules[index].timeRanges, currentHour)
          return (
            <Polygon
              key={index}
              paths={district.poligons}
              onClick={handleClickDistrict(key, district, schedules[index].timeRanges)}
              options={{
                strokeWeight: 1,
                fillOpacity: isPowerOff ? 0.5 : 0.05,
              }} />
          )
        })
      }
      <DrawingManager
        onPolygonComplete={handleCompletePolygon}
        defaultOptions={{
          drawingControl: true,
          drawingControlOptions: {
            position: window.google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['polygon'],
          },
          circleOptions: {
            fillColor: `#ffff00`,
            fillOpacity: 1,
            strokeWeight: 5,
            clickable: false,
            editable: true,
            zIndex: 1,
          },
        }}
      />
    </GoogleMap>
  )
}))

export default Map
