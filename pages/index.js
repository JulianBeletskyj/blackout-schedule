import { useEffect, useState } from 'react'
import styles from '@/styles/Home.module.css'
import { useEffectOnce } from '../utils/hooks'
import moment from 'moment'
import Map from '../components/Map'

const parseTimeRanges = (data) => {
  return data.map(district => {
    const { streets, timeRanges } = district
    const parsedTimeRanges = timeRanges.map(timeRange => {
      const [startString, endString] = timeRange.split('-')
      const start = moment(startString, 'HH:mm').hour()
      const end = moment(endString, 'HH:mm').hour()
      return [start, end]
    })
    return {
      streets,
      timeRanges: parsedTimeRanges
    }
  })
}

export default function Home() {

  const [schedules, setSchedules] = useState([])

  useEffectOnce(() => {
    fetch('/api/v1/getSchedule').then(async res => {
      const json = await res.json()
      if (!json.error) {
        const result = parseTimeRanges(json.data)
        setSchedules(result)
      }
    })
  })

  return (
    <main className={styles.main}>
      {
        schedules.length
          ? <Map
              schedules={schedules}
              googleMapURL={`https://maps.googleapis.com/maps/api/js?key=AIzaSyBWL2Cp_rDpY0EtgIYNRyeUlUdm1IiQ4WQ&v=3.exp&callback=Function.prototype&libraries=drawing`}
              loadingElement={<div style={{ height: `100%` }} />}
              containerElement={<div style={{ height: `100%` }} />}
              mapElement={<div style={{ height: `100%` }} />} />
          : <h1>Loading...</h1>
      }
    </main>
  )
}
