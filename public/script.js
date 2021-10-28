window.addEventListener('load', e => {
    const peer = new Peer();

    // video source
    let myStream;
    var peerList = [];

    // for screensharing
    var currentPeer;

    peer.on('open', id => {
        document.getElementById('show-peer').innerHTML = id;
    });

    peer.on('call', call => {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        }).then( stream => {
            myStream = stream; // store video url to myStream

            addOurVideo(stream); // for them and us to be able to see our personal video
            // when someone answer the call
            call.answer(stream);
            call.on('stream', remoteStream => {
                // pag yung call.peer eh hindi existing sa peerList array
                if(!peerList.includes(call.peer)){
                    addRemoteVideo(remoteStream);
                    currentPeer = call.peerConnection; // for screen sharing
                    peerList.push(call.peer); // ipush mo ko sa array;
                }
            })
        }).catch(err => {
            console.log(err + " unable to get media.");
        });
    })


    document.getElementById('call-peer').addEventListener('click', e => {
        let remotePeerId = document.getElementById('peerID').value;

        document.getElementById('show-peer').innerHTML = 'connecting ' + remotePeerId;
        callPeer(remotePeerId);
    });



    // for screen sharing
    document.getElementById('shareScreen').addEventListener('click', e => {
        // to get screen share
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

            sender.replaceTrack(videoTrack)
        })
        .catch( err => {
            console.log("Unable to get display media" + err);
        })
    });






    function callPeer(id){
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then( stream => {
            myStream = stream; // store video url to myStream

            addOurVideo(stream); // for them and us to be able to see our personal video

            let call = peer.call(id, stream);

            // when someone call, pass the video url
            call.on('stream', remoteStream => {
                if(!peerList.includes(call.peer)){
                    addRemoteVideo(remoteStream);
                    currentPeer = call.peerConnection; // for screensharing
                    peerList.push(call.peer);
                }
            })
        }).catch(err => {
            console.log(err + " unable to get media.");
        });
    }



    // stop screen sharing
    function stopScreenShare(){
        let videoTrack = myStream.getVideoTracks()[0];
        var sender = currentPeer.getSenders().find( s => {
            return s.track.kind == videoTrack.kind;
        });

        sender.replaceTrack(videoTrack);
    }
    


    function addRemoteVideo(stream){
        let video = document.createElement('video');
        video.classList.add('video'); // para magkaroon lang ng styling
        video.srcObject = stream;
        video.play();
        document.getElementById('remoteVideo').append(video);
    }


    function addOurVideo(stream){
        let video = document.createElement('video');
        video.classList.add('video'); // para magkaroon lang ng styling
        video.srcObject = stream;
        video.play();
        document.getElementById('ourVideo').append(video);
    }
});