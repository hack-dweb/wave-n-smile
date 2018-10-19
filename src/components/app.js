'use strict'

const React = require('react');
const IPFS = require('ipfs');
const Hls = require('hls.js');
const HlsjsIpfsLoader = require('hlsjs-ipfs-loader');

const stringToUse = 'hello world from webpacked IPFS'

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      id: null,
      version: null,
      protocol_version: null,
      added_file_hash: null,
      added_file_contents: null
    }
  }

  componentDidMount() {
    const self = this
    let node

    create()

    function create() {
      // Create the IPFS node instance

      node = new IPFS({repo: String(Math.random() + Date.now())})

      node.once('ready', () => {
        console.log('IPFS node is ready')

        var testhash = "QmdpAidwAsBGptFB3b6A9Pyi5coEbgjHrL3K2Qrsutmj9K"
        Hls.DefaultConfig.loader = HlsjsIpfsLoader;
        Hls.DefaultConfig.debug = false;
        if (Hls.isSupported()) {
          var video = document.getElementById('video');
          var hls = new Hls();
          hls.config.ipfs = node;
          hls.config.ipfsHash = testhash;
          hls.loadSource('master.m3u8');
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
          });
        }

        ops()
      })
    }

    function ops() {
      node.id((err, res) => {
        if (err) {
          throw err
        }
        self.setState({
          id: res.id,
          version: res.agentVersion,
          protocol_version: res.protocolVersion
        })
      })

      node.files.add([Buffer.from(stringToUse)], (err, filesAdded) => {
        if (err) {
          throw err
        }

        const hash = filesAdded[0].hash
        self.setState({added_file_hash: hash})

        node.files.cat(hash, (err, data) => {
          if (err) {
            throw err
          }
          self.setState({added_file_contents: data})
        })
      })
    }
  }

  render() {
    return (
      <div style={{textAlign: 'center'}}>
        <h1>Everything is working!</h1>
        <p>Your ID is <strong>{this.state.id}</strong></p>
        <p>Your IPFS version is <strong>{this.state.version}</strong></p>
        <p>Your IPFS protocol version is <strong>{this.state.protocol_version}</strong></p>
        <hr/>
        <div>
          Added a file! <br/>
          {this.state.added_file_hash}
        </div>
        <br/>
        <br/>
        <p>
          Contents of this file: <br/>
          {this.state.added_file_contents}
        </p>
        <video id="video" controls></video>
      </div>
    )
  }
}

module.exports = App
