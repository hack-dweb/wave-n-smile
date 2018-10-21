import {Component, ElementRef, OnInit} from '@angular/core';
import {Ipfs} from '../../ipfs/services/ipfs';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';
import {Buffer} from 'buffer';
import {debug} from 'util';

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
  messages: Array<string>;
  myMessages: Array<string>;
  ipfs;
  displayPeerList = false;
  mediaRecorder;
  isRecording = false;
  currentTime = null;
  maxRecordTime = 5000;
  autoStopTimeout;

  image: SafeUrl;

  constructor(ipfs: Ipfs, private el: ElementRef) {
    this.messages = [];
    this.peers = [];
    this.myMessages = [];
    this.ipfs = ipfs;
  }

  initMediaRecorder() {
    return new Promise((resolve, reject) => {
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
            (<HTMLVideoElement>document.getElementById('self')).srcObject = stream;
            resolve(this.mediaRecorder);
          });
      } else {
        reject('Not Supported');
      }
    });
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  autoStop() {
    if (this.currentTime === null) {
      this.currentTime = this.maxRecordTime;
    }
    if (this.currentTime > 0) {
      clearTimeout(this.autoStopTimeout);
      this.currentTime -= 1000;
      console.log(this.currentTime);
      this.autoStopTimeout = setTimeout(this.autoStop.bind(this), 1000);
    } else {
      clearTimeout(this.autoStopTimeout);
      this.currentTime = null;
      this.stopRecording();
    }
  }

  startRecording() {
    this.initMediaRecorder().then(() => {
      this.isRecording = true;
      this.mediaRecorder.start(10000);
      this.autoStop();
    });
  }

  onData(e) {
    const fileReader = new FileReader();
    fileReader.onload = event => {
      const arr = (<FileReader>event.target).result;
      const buffer = Buffer.from(arr);
      console.log('PUBLISH!!')
      this.ipfs.pub(this.topic, buffer);
    };
    fileReader.readAsArrayBuffer(e.data);
  }

  stopRecording() {
    this.isRecording = false;
    this.mediaRecorder.stop();
  }

  addPeer(peer) {
    this.ipfs.connectPeer(peer);
  }

  addVideo(data, videoEl) {
    const blob = new Blob([data], {'type': 'video/x-matroska;codecs=avc1,opus'});
    const url = window.URL.createObjectURL(blob);
    if (videoEl.paused || videoEl.ended) {
      videoEl.src = url;
      videoEl.play().then(
        () => {
        },
        (reason) => console.log('cannot', url, reason)
      );
      videoEl.loop = true;
    }
  }

  ngOnInit() {
    this.ipfs.ready().subscribe(() => {
      this.ipfs.sub(this.topic).subscribe(data => {
        console.log('NEW DATE');
        const element: HTMLVideoElement = document.createElement('video');
        this.el.nativeElement.querySelector('.video-container').appendChild(element);
        this.addVideo(data, element);
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
