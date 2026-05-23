import { Gun } from '../gun/root.js';

declare var window: any;
declare var global: any;
declare var location: any;
declare var MediaStream: any;

(Gun as any).on('opt', function (this: any, root: any) {
  this.to.next(root);
  const opt = root.opt;
  if (root.once) return;
  if (!(Gun as any).Mesh) return;
  if (false === opt.RTCPeerConnection) return;

  let env: any;
  if (typeof window !== 'undefined') { env = window; }
  if (typeof global !== 'undefined') { env = global; }
  env = env || {};

  const rtcpc = opt.RTCPeerConnection || env.RTCPeerConnection || env.webkitRTCPeerConnection || env.mozRTCPeerConnection;
  const rtcsd = opt.RTCSessionDescription || env.RTCSessionDescription || env.webkitRTCSessionDescription || env.mozRTCSessionDescription;
  const rtcic = opt.RTCIceCandidate || env.RTCIceCandidate || env.webkitRTCIceCandidate || env.mozRTCIceCandidate;
  if (!rtcpc || !rtcsd || !rtcic) return;
  opt.RTCPeerConnection = rtcpc;
  opt.RTCSessionDescription = rtcsd;
  opt.RTCIceCandidate = rtcic;
  opt.rtc = opt.rtc || { 'iceServers': [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ] };
  opt.rtc.dataChannel = opt.rtc.dataChannel || { ordered: false, maxRetransmits: 2 };
  opt.rtc.sdp = opt.rtc.sdp || { mandatory: { OfferToReceiveAudio: false, OfferToReceiveVideo: false } };
  opt.rtc.max = opt.rtc.max || 55;
  opt.rtc.room = opt.rtc.room || (Gun as any).window && (location.hash.slice(1) || location.pathname.slice(1));
  opt.announce = function (_to: any) {
    opt.rtc.start = +new Date;
    root.$.get('/RTC/' + opt.rtc.room + '<?99').get('+').put(opt.pid, function (ack: any) {
      if (!ack.ok || !ack.ok.rtc) return;
      plan(ack);
    }, { acks: opt.rtc.max }).on(function (last: any, _key: any, msg: any) {
      if (last === opt.pid || opt.rtc.start > msg.put['>']) return;
      plan({ '#': '' + msg['#'], ok: { rtc: { id: last } } });
    });
  };

  const mesh = opt.mesh = opt.mesh || (Gun as any).Mesh(root);
  const wired = mesh.wire;
  mesh.hear['rtc'] = plan;
  mesh.wire = function (media: any) {
    try {
      wired && wired(media);
      if (!(media instanceof MediaStream)) return;
      ((open as any).media = (open as any).media || {})[media.id] = media;
      for (const p in opt.peers) {
        const peerVal = opt.peers[p] || '';
        peerVal.addTrack && media.getTracks().forEach((track: any) => {
          peerVal.addTrack(track, media);
        });
        peerVal.createOffer && peerVal.createOffer(function (offer: any) {
          peerVal.setLocalDescription(offer);
          mesh.say({ '#': root.ask(plan), dam: 'rtc', ok: { rtc: { offer: offer, id: opt.pid } } }, peerVal);
        }, function () { }, opt.rtc.sdp);
      }
    } catch (e) { console.log(e); }
  };
  root.on('create', function (this: any, at: any) {
    this.to.next(at);
    setTimeout(opt.announce, 1);
  });

  function plan(msg: any) {
    if (!msg.ok) return;
    const rtc = msg.ok.rtc;
    let peer: any, tmp: any;
    if (!rtc || !rtc.id || rtc.id === opt.pid) return;
    peer = open(msg, rtc);
    if (tmp = rtc.candidate) {
      return peer.addIceCandidate(new opt.RTCIceCandidate(tmp));
    }
    if (tmp = rtc.answer) {
      tmp.sdp = tmp.sdp.replace(/\\r\\n/g, '\r\n');
      return peer.setRemoteDescription(peer.remoteSet = new opt.RTCSessionDescription(tmp));
    }
    if (tmp = rtc.offer) {
      rtc.offer.sdp = rtc.offer.sdp.replace(/\\r\\n/g, '\r\n');
      peer.setRemoteDescription(new opt.RTCSessionDescription(tmp));
      return peer.createAnswer(function (answer: any) {
        peer.setLocalDescription(answer);
        root.on('out', { '@': msg['#'], ok: { rtc: { answer: answer, id: opt.pid } } });
      }, function () { }, opt.rtc.sdp);
    }
  }

  function open(msg: any, rtc: any, _peer?: any) {
    let peer: any;
    if (peer = opt.peers[rtc.id] || (open as any)[rtc.id]) { return peer; }
    (peer = new opt.RTCPeerConnection(opt.rtc)).id = rtc.id;
    const wire = peer.wire = peer.createDataChannel('dc', opt.rtc.dataChannel);
    function rtceve(eve: any) { eve.peer = peer; root.$.on('rtc', eve); }
    peer.$ = root.$;
    (open as any)[rtc.id] = peer;
    peer.ontrack = rtceve;
    peer.onremovetrack = rtceve;
    peer.onconnectionstatechange = rtceve;
    wire.to = setTimeout(function () { delete (open as any)[rtc.id]; }, 1000 * 60);
    wire.onclose = function () { mesh.bye(peer); };
    wire.onerror = function (_err: any) { };
    wire.onopen = function (_e: any) {
      delete (open as any)[rtc.id];
      mesh.hi(peer);
    };
    wire.onmessage = function (msg: any) {
      if (!msg) return;
      mesh.hear(msg.data || msg, peer);
    };
    peer.onicecandidate = function (e: any) {
      rtceve(e);
      if (!e.candidate) return;
      root.on('out', { '@': (msg || '')['#'], '#': root.ask(plan), ok: { rtc: { candidate: e.candidate, id: opt.pid } } });
    };
    peer.ondatachannel = function (e: any) {
      rtceve(e);
      const rc = e.channel;
      rc.onmessage = wire.onmessage;
      rc.onopen = wire.onopen;
      rc.onclose = wire.onclose;
    };
    if (rtc.offer) return peer;
    for (const m in (open as any).media) {
      const media = (open as any).media[m];
      media.getTracks().forEach((track: any) => {
        peer.addTrack(track, media);
      });
    }
    peer.createOffer(function (offer: any) {
      peer.setLocalDescription(offer);
      root.on('out', { '@': (msg || '')['#'], '#': root.ask(plan), ok: { rtc: { offer: offer, id: opt.pid } } });
    }, function () { }, opt.rtc.sdp);
    return peer;
  }
});
