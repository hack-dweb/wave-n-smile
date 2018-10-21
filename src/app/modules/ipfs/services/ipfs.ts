import {Injectable} from '@angular/core';
import * as IPFS from 'ipfs';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class Ipfs {
  node: IPFS;

  constructor() {
    this.node = new IPFS({
      repo: 'MEIN_TEST_REPO',
      EXPERIMENTAL: {
        pubsub: true
      },
      relay: {
        enabled: true, // enable relay dialer/listener (STOP)
        hop: {
          enabled: true // make this node a relay (HOP)
        }
      },
      preload: {
        enabled: true,
        addresses: [
          '/ip4/51.15.99.113/tcp/4001/ipfs/QmbfSzbrPZEGsNea7Dqkk4kEgAiLDEwhgYw1ababTYD1zS'
        ]
      },
      config: {
        Addresses: {
          Swarm: [
            '/ip4/51.15.99.113/tcp/4001/ipfs/QmbfSzbrPZEGsNea7Dqkk4kEgAiLDEwhgYw1ababTYD1zS',
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          ]
        },
        Discovery: {
          MDNS: {
            Enabled: false,
            Interval: 10
          },
          webRTCStar: {
            Enabled: true
          }
        },
        Bootstrap: [
          '/ip4/51.15.99.113/tcp/4001/ipfs/QmbfSzbrPZEGsNea7Dqkk4kEgAiLDEwhgYw1ababTYD1zS',
        ]
      }
    });
  }

  ready() {
    return Observable.create(observer => {
      this.node.on('ready', () => {
        observer.next();
        observer.complete();
      });
    });
  }

  sub(arg) {
    return Observable.create(observer => {
      this.node.pubsub.subscribe(arg, {discover: true}, (msg) => {
        observer.next(msg.data);
      });
    });
  }

  pub(arg, msg) {
    this.node.pubsub.publish(arg, new this.node.types.Buffer(msg));

    this.node.files.add([new this.node.types.Buffer(msg)], (err, filesAdded) => {
      if (err) {
        throw err;
      }

      const hash = filesAdded[0].hash;
      console.log('HASH', hash);
    });

  }

  addresses(): Observable<Array<string>> {
    return Observable.create(observer => {
      this.node.id((err, identity) => {
        if (err) {
          throw err;
        }
        observer.next(identity.addresses);
        observer.complete();
      });
    });
  }

  connectPeer(peer) {
    this.node.swarm.connect(peer, (err) => {
      if (err) {
        console.log('Cannot connect to ' + peer, err);
        return;
      } else {
        console.log(peer, 'is Connected');
      }
    });
  }

  peers() {
    return Observable.create(observer => {
      this.node._libp2pNode.on('peer:connect', peer => {
        observer.next(peer);
      });
    });
  }

  get(hash) {
    return Observable.create(observer => {
      try {
        this.node.files.get(hash, function (err, files) {
          if (err) {
            throw Observable.throw('Not found');
          }
          observer.next(files);
          observer.complete();
        });
      } catch (e) {
        throw Observable.throw(e);
      }
    });
  }
}
