import {Component, OnInit} from '@angular/core';
import {Ipfs} from '../../ipfs/services/ipfs';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';
import { debug } from 'util';

@Component({
  selector: 'app-root',
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent implements OnInit {
  title = 'app';
  addresses: Observable<Array<string>>;
  peers: Array<string>;
  messages: Array<string>;
  ipfs;
  displayPeerList = false;
  mediaRecorder;
  chunks: Array<any>;

  image: SafeUrl;

  constructor(ipfs: Ipfs, private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    this.messages = [];
    this.peers = [];
    this.ipfs = ipfs;
    this.initMediaRecorder();
  }

  initMediaRecorder() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('getUserMedia supported.');
      navigator.mediaDevices.getUserMedia(
        // constraints - only audio needed for this app
        {
          audio: true
        })
        .then((stream) => {
          this.mediaRecorder = new (<any>window).MediaRecorder(stream);
          this.mediaRecorder.onstop = this.onStop.bind(this);
          this.mediaRecorder.ondataavailable = this.onAudioData.bind(this);
        });
    }
  }

  recordAudio() {
    this.chunks = [];
    this.mediaRecorder.start();
  }

  onAudioData(e) {
    this.chunks.push(e.data);
  }

  onStop() {
    const blob = new Blob(this.chunks, {'type': 'audio/ogg; codecs=opus'});
    this.chunks = [];
    const audioURL = window.URL.createObjectURL(blob);
    this.ipfs.node.files.add(blob, (err, res) => {
      this.ipfs.pub('hello', res[0].hash);
    });
    const audio: HTMLAudioElement = <HTMLAudioElement>document.getElementById('a');
    audio.src = audioURL;
  }

  stopRecording() {
    this.mediaRecorder.stop();
  }

  addPeer(peer) {
    this.ipfs.connectPeer(peer);
  }

  ngOnInit() {
    this.ipfs.ready().subscribe(() => {
      this.ipfs.sub('hello').subscribe(data => {
        this.messages.push(data.toString());
        this.ipfs.get(data.toString()).subscribe((files) => {
          console.log(files);
          const blob = new Blob([files[0].content], { 'type': 'audio/ogg; codecs=opus' });
          const audioURL = window.URL.createObjectURL(blob);
          const audio: HTMLAudioElement = <HTMLAudioElement>document.getElementById('a');
          audio.src = audioURL;
        });
      });
      this.ipfs.peers().subscribe(peer => {
        this.peers.push(peer.id._idB58String);
      });
      this.addresses = this.ipfs.addresses();

      function blobToDataURL(blob) {
        return new Promise((fulfill, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = (e) => fulfill(reader.result);
          reader.readAsDataURL(blob);
        });
      }
    });
  }

  publish(message) {
    this.ipfs.pub('hello', message);
  }
}
