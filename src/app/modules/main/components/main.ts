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
  topic = 'hello';
  addresses: Observable<Array<string>>;
  peers: Array<string>;
  ipfs;
  displayPeerList = false;
  mediaRecorder;

  image: SafeUrl;

  constructor(ipfs: Ipfs, private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    this.peers = [];
    this.ipfs = ipfs;
    this.initMediaRecorder();
  }

  initMediaRecorder() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(
        {
          audio: true,
          video: {
            width: 100,
            frameRate: 10
          }
        })
        .then((stream) => {
          this.mediaRecorder = new (<any>window).MediaRecorder(stream);
          this.mediaRecorder.ondataavailable = this.onData.bind(this);
        });
    }
  }

  startRecording() {
    this.mediaRecorder.start(10000);
  }

  onData(e) {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      const arr = (<FileReader>event.target).result;
      const buffer = Buffer.from(arr);
      this.ipfs.pub(this.topic, buffer);
    };
    fileReader.readAsArrayBuffer(e.data);
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
        const blob = new Blob([data], { 'type': 'video/x-matroska;codecs=avc1,opus' });
        const url = window.URL.createObjectURL(blob);
        const element: HTMLVideoElement = <HTMLVideoElement>document.getElementById('media');
        if (element.paused || element.ended) {
          console.log('beep');
          element.src = url;
          element.play().then(
            () => {},
            (reason) => console.log('cannot', url, reason)
          );
        } else {
          console.log('boop');
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
