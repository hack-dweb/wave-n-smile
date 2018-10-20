import { Component, OnInit } from '@angular/core';
import { Ipfs } from '../../ipfs/services/ipfs';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable } from 'rxjs/Observable';
import { Buffer } from 'buffer';
import { debug } from 'util';

@Component({
  selector: 'app-root',
  templateUrl: './main.html',
  styleUrls: ['./main.scss']
})
export class MainComponent implements OnInit {
  title = 'app';
  topic: 'hello';
  addresses: Observable<Array<string>>;
  peers: Array<string>;
  messages: Array<string>;
  myMessages: Array<string>;
  ipfs;
  displayPeerList = false;
  mediaRecorder;
  chunks: Array<any>;

  image: SafeUrl;

  constructor(ipfs: Ipfs, private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    this.messages = [];
    this.peers = [];
    this.myMessages = [];
    this.ipfs = ipfs;
    this.initMediaRecorder();
  }

  initMediaRecorder() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(
        {
          audio: true,
          video: true
        })
        .then((stream) => {
          this.mediaRecorder = new (<any>window).MediaRecorder(stream);
          this.mediaRecorder.onstop = this.onStop.bind(this);
          this.mediaRecorder.ondataavailable = this.onData.bind(this);
        });
    }
  }

  startRecording() {
    this.chunks = [];
    this.mediaRecorder.start();
  }

  onData(e) {
    this.chunks.push(e.data);
    const fileReader = new FileReader();
    fileReader.onload = event => {
      const arr = (<FileReader>event.target).result;
      const buffer = Buffer.from(arr);
      this.ipfs.node.files.add(buffer, (err, res) => {
        this.ipfs.pub(this.topic, res[0].hash);
        this.myMessages.push(res[0].hash);
      });
    };
    fileReader.readAsArrayBuffer(e.data);
  }

  onStop() {
    const url = window.URL.createObjectURL(this.chunks[0]);
    const element: HTMLVideoElement = <HTMLVideoElement>document.getElementById('media');
    element.src = url;
  }

  stopRecording() {
    this.mediaRecorder.stop();
  }

  addPeer(peer) {
    this.ipfs.connectPeer(peer);
  }

  ngOnInit() {
    this.ipfs.ready().subscribe(() => {
      this.ipfs.sub(this.topic).subscribe(data => {
        const contentHash = data.toString();
        this.messages.push(contentHash);
        if (this.myMessages.includes(contentHash)) {
          this.ipfs.get(contentHash).subscribe((files) => {
            const blob = new Blob([files[0].content], { 'type': 'video/x-matroska;codecs=avc1,opus' });
            const url = window.URL.createObjectURL(blob);
            const element: HTMLVideoElement = <HTMLVideoElement>document.getElementById('media');
            element.src = url;
            element.oncanplaythrough.bind(e => {
              element.play();
            });
          });
        }
      });
      this.ipfs.peers().subscribe(peer => {
        this.peers.push(peer.id._idB58String);
      });
      this.addresses = this.ipfs.addresses();
    });
  }

  publish(message) {
    this.ipfs.pub(this.topic, message);
  }
}
