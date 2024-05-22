import 'jsqr'
import 'dashjs'
import './style.css'

document.querySelector('#app').innerHTML = `
  <div id="container">
    <div id="left">
      <div id="panel">
        <div id="stat-control">
        
          <div id="stat">
            <div class="stat-element">
              <label>Live Delay:</label>
              <span id="live">5.21</span>
            </div>

            <div class="stat-element">
              <label>G2G Delay:</label>
              <span id="g2g">5.21</span>
            </div>
            
            <div class="stat-element">
              <label>Average Delay:</label>
              <span id="average">5.21</span>
            </div>
            
            <div class="stat-element">
              <label>Wall Time:</label>
              <span id="wall">11:45:21</span>
            </div>
            <div class="stat-element">
              <label>Buffer Level:</label>
              <span id="buffer">5.21</span>
            </div>
          </div>
          <div id="control">
            <div id="skips">
              <button id="trace10">
                <svg fill="#ffffffaa" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                  style="transform: rotate(180deg); filter: brightness(0%);" width="15px" height="15px" viewBox="0 0 220.682 220.682"
                  xml:space="preserve">
                  <g>
                    <polygon points="92.695,38.924 164.113,110.341 92.695,181.758 120.979,210.043 220.682,110.341 120.979,10.639 	"/>
                    <polygon points="28.284,210.043 127.986,110.341 28.284,10.639 0,38.924 71.417,110.341 0,181.758 	"/>
                  </g>
                </svg>
              </button>
              <button id="skip10">
                <svg fill="#ffffffaa" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                style="filter: brightness(0%);" width="15px" height="15px" viewBox="0 0 220.682 220.682"
                xml:space="preserve">
                  <g>
                    <polygon points="92.695,38.924 164.113,110.341 92.695,181.758 120.979,210.043 220.682,110.341 120.979,10.639 	"/>
                    <polygon points="28.284,210.043 127.986,110.341 28.284,10.639 0,38.924 71.417,110.341 0,181.758 	"/>
                  </g>
                </svg>
              </button>
            </div>
            <button id="capture">Capture</button>
            <button id="go_live">Go Live</button>     
          </div>
        </div>
        <div id="stream">
          <input id="link" placeholder="Manifest URL" />     
          <select id="quality"></select>
        </div>
      </div>
    </div>
    <div id="right">
      <video id="video"controls></video>
    </div>
  </div>
`

const dom_statistics = {
  live: document.querySelector('#live'),
  g2g: document.querySelector('#g2g'),
  average: document.querySelector('#average'),
  wall: document.querySelector('#wall'),
  buffer: document.querySelector('#buffer')
}

const dom_control = {
  trace10: document.querySelector('#trace10'),
  skip10: document.querySelector('#skip10'),
  capture: document.querySelector('#capture'),
  go_live: document.querySelector('#go_live')
}

const dom_stream = {
  quality: document.querySelector('#quality'),
  link: document.querySelector('#link')
}
dom_stream.link.value = 'https://stream.xreos.co/stream.mpd'
dom_stream.quality.innerHTML = `
  <option value="0">Auto</option>
`

var g2g = []
var quality = 0
const video = document.querySelector('#video')
const player = dashjs.MediaPlayer().create()
const settings = {
  'streaming': {
    'delay': {
      'liveDelay': 3.0
    },
    'buffer': {
      'stallThreshold': 0.05
    },
    'liveCatchup': {
      'mode': 'liveCatchupModeLoLP',
      'playbackBufferMin': 0.5,
      'playbackRate': {
        'min': -0.3,
        'max': 0.3 
        }
    },
    'abr': {
      'useDefaultABRRules': true,
      'ABRStrategy': 'abrLoLP',
      'fetchThroughputCalculationMode': 'abrFetchThroughputCalculationMoofParsing',
    }
  }
}
player.updateSettings(settings)
player.initialize(video, dom_stream.link.value, true)
player.setAutoPlay(true)

const initialize_app = () => {
  
  dom_control.trace10.addEventListener('click', () => {
    player.seek(player.time() - 10)
  })
  dom_control.skip10.addEventListener('click', () => {
    player.seek(player.time() + 10)
  })
  dom_control.capture.addEventListener('click', () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'capture.png'
    a.click()
  })
  dom_control.go_live.addEventListener('click', () => {
    player.seek(player.duration() - 1)
  })
  dom_stream.link.addEventListener('change', () => {
    player.attachSource(dom_stream.link.value)
  })
  dom_stream.quality.addEventListener('change', () => {
    if (dom_stream.quality.value == -1) {
      player.updateSettings({'streaming': {'abr': {'autoSwitchBitrate': {'video': true}}}})
      return
    }
    player.updateSettings({'streaming': {'abr': {'autoSwitchBitrate': {'video': false}}}})
    quality = dom_stream.quality.value
    player.setQualityFor('video', quality)
  })
  player.on('playbackStarted', () => {
    const bitrates = player.getBitrateInfoListFor('video')
    dom_stream.quality.innerHTML = `<option value="-1">Auto</option>`
    bitrates.forEach((bitrate, index) => {
      dom_stream.quality.innerHTML += `<option value="${index}">${bitrate.bitrate}</option>`
    })
  }) 
  setInterval(() => {
    dom_statistics.buffer.innerHTML = player.getBufferLength().toFixed(2)
    dom_statistics.live.innerHTML = player.getCurrentLiveLatency().toFixed(2)
    if (player.isSeeking()) {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const data = context.getImageData(0, 0, canvas.width, canvas.height)
      const result = jsQR(data.data, data.width, data.height)
      if (result) {
        const time = parseInt(result.data)
        if (time) {
          const delay = ((moment().unix()*1000 - parseInt(code.data))/1000.0).toFixed(2)
          dom_statistics.g2g.innerHTML = delay.toFixed(2)
          g2g.push(delay)
          if (g2g.length > 10) {
            g2g.shift()
            dom_statistics.average.innerHTML = (g2g.reduce((a, b) => a + b, 0) / g2g.length).toFixed(2)
          }
        }
      }
      dom_statistics.g2g.innerHTML = 0.0
      dom_statistics.average.innerHTML = 0.0
    }
  }, 50)

  setInterval(() => {
    const date = new Date()
    dom_statistics.wall.innerHTML =
      (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' +
      (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())+ ':' +
      (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
  }, 1000)
}

initialize_app()
