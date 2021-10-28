const socket = io('/');

const peer = new Peer(undefined, {
    host: '/',
    port: '3000'
});

const myVideo = document.querySelector('#myVideo');
const peers = {} // dito iistore yung userId ng nagleave

var currentPeer; // for screen sharing

peer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id);
});


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    const video = document.createElement('video');
    addVideoStream(video, stream);


    // ito yung final step, although nakaconnect tayo sa ibang user di parin natin makikita yung 
    // video nila, kasi need pa natin makinig sa .answer() na method
    // when someone tries to call us
    peer.on('call', call => {  
        // sagutin mo yung tawag tapos isend mo sakanila yung stream
        call.answer(stream);

        const video = document.createElement('video');
        // sinasagot natin yung call, pero di natin hinahayaan tanggapin yung ibang video stream
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream);
            currentPeer = call.peerConnection; // for screen sharing
        })
    })



    // so when new user connects to our room, we will send them our current video stream
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    });

    
})

// sa pamamagitan neto nalalaman natin yung userId na nagleave kaya pwede natin tanggalin yung vide nilang naiwan
socket.on('user-disconnected', userId => {
    // bilang may laman na yung peers malalaman na natin kung sino ron yung id na nagleave
    // if existing yung id na yun sa peers
    if(peers[userId]) peers[userId].close(); // icoclose natin yung connection nung same userId
});



document.querySelector('#shareScreen').addEventListener('click', e => {
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        }
    })
    .then( stream => {
        // replace camera video with SCREEN SHARE VIDEO
        let videoTrack = stream.getVideoTracks()[0];

        // when stop sharing, replace SCREEN SHARE VIDEO with Camera Video
        videoTrack.onended = () => {
            stopScreenShare();
        }

        let sender = currentPeer.getSenders().find( s => {
            return s.track.kind = videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    });
});

function stopScreenShare(){
    let videoTrack = myStream.getVideoTracks()[0];
    var sender = currentPeer.getSenders().find( s => {
        return s.track.kind == videoTrack.kind;
    });

    sender.replaceTrack(videoTrack);
}


// get the current video stream of creator
function connectToNewUser(userId, stream){
    const call = peer.call(userId, stream); // we will call to send them our video stream
    const video = document.createElement('video');
    // when they send back their video stream, stream ang tawag don
    call.on('stream', userVideoStream => {
        // so ngayon, yung video na sinend nila gawan mo ng video tag
        addVideoStream(video, userVideoStream);
        currentPeer = call.peerConnection; // for screen sharing
    });

    // pag tinapos yung tawag, burahin mo lang yung video
    call.on('close', () => {
        video.remove();
    });

    // every user id ay didirektang pasok sa peers na object na ginawa natin
    peers[userId] = call;

}

// creation of video
function addVideoStream(video, stream){
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    myVideo.append(video);
}