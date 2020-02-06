(() => {
    const recvId = document.getElementById('receiver-id');
    const status = document.getElementById('status');
    const callButton = document.getElementById('call-button');
    const videoFrame = document.getElementById('my-video');

    const classNames = {
        secondary: 'alert alert-secondary',
        success: 'alert alert-success',
        warning: 'alert alert-warning',
        danger: 'alert alert-danger'
    };

    const displayMediaStreamConstraints = {
        video: {
            // resolutions:
            // fit-screen = { width: screen.width, height: screen.heigth }
            // 4k = { width: 3840, height: 2160 }
            // 1080p = { width: 1920, height: 1080 }
            // 720p = { width: 1280, height: 720 }
            // 480p = { width: 853, height: 480 }
            // 360p = { width: 640, height: 360 }
            width: screen.width,
            height: screen.height,

            // 30, 25, 15, 5
            frameRate: 30,

            // 16:9 === 1.77,
            // 4:3 === 1.33
            // 21:9 === 2.35
            // 14:10 === 1.4
            // 19:10 === 1.9
            aspectRatio: 1.77,

            // always, never, motion
            cursor: 'always'
        }
    };

    const aspectRatioSelect = document.getElementById('aspect-ratio-select');
    const frameRateSelect = document.getElementById('frame-rate-select');
    const resolutionSelect = document.getElementById('resolution-select');
    const cursorSelect = document.getElementById('cursor-select');

    let lastPeerId = null;
    let peer = null; // Own peer object
    let conn = null;

    /**
     * Create the Peer object for our end of the connection.
     *
     * Sets up callbacks that handle any events related to our
     * peer object.
     */
    function initialize() {
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(null, {
            debug: 2
        });

        peer.on('open', () => {
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                console.warn('Received null id from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }

            console.log('ID: ' + peer.id);
            recvId.textContent = peer.id;
            status.textContent = 'Awaiting connection...';
            status.className = classNames.secondary;
        });
        peer.on('connection', c => {
            // Allow only a single connection
            if (conn) {
                c.on('open', () => {
                    c.send('Already connected to another client');
                    setTimeout(() => {
                        c.close();
                    }, 500);
                });
                return;
            }

            conn = c;

            status.textContent = `Connected to: ${conn.peer}`;
            status.className = classNames.success;
            callButton.disabled = false;

            ready();
        });
        peer.on('disconnected', () => {
            status.textContent = 'Connection lost. Please reconnect';
            status.className = classNames.danger;

            console.warn('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            callButton.disabled = true;
            peer.reconnect();
        });
        peer.on('close', () => {
            conn = null;
            status.textContent = 'Connection destroyed. Please refresh';
            status.className = classNames.danger;

            console.warn('Connection destroyed');
            callButton.disabled = true;
        });
        peer.on('error', err => {
            status.textContent = err;
            status.className = classNames.danger;
            console.log(err);
            callButton.disabled = true;
        });

        addSelectorEvents();
    }

    function addSelectorEvents() {
        aspectRatioSelect.addEventListener('change', e => {
            displayMediaStreamConstraints.video.aspectRatio = e.target.value;
        });

        frameRateSelect.addEventListener('change', e => {
            displayMediaStreamConstraints.video.frameRate = e.target.value;
        });

        cursorSelect.addEventListener('change', e => {
            displayMediaStreamConstraints.video.cursor = e.target.value.toLowerCase();
        });

        resolutionSelect.addEventListener('change', e => {
            switch (e.target.value) {
                case '4K': {
                    displayMediaStreamConstraints.video.width = 3840;
                    displayMediaStreamConstraints.video.height = 2160;
                    break;
                }
                case '1080p': {
                    displayMediaStreamConstraints.video.width = 1920;
                    displayMediaStreamConstraints.video.height = 1080;
                    break;
                }
                case '720p': {
                    displayMediaStreamConstraints.video.width = 1280;
                    displayMediaStreamConstraints.video.height = 720;
                    break;
                }
                case '480p': {
                    displayMediaStreamConstraints.video.width = 853;
                    displayMediaStreamConstraints.video.height = 480;
                    break;
                }
                case '360p': {
                    displayMediaStreamConstraints.video.width = 640;
                    displayMediaStreamConstraints.video.height = 360;
                    break;
                }
                default: {
                    displayMediaStreamConstraints.video.width = screen.width;
                    displayMediaStreamConstraints.video.height = screen.height;
                    break;
                }
            }
        });
    }

    /**
     * Triggered once a connection has been achieved.
     * Defines callbacks to handle incoming data and connection events.
     */
    function ready() {
        conn.on('close', function() {
            status.textContent = 'Connection closed';
            status.className = classNames.warning;
            conn = null;
        });
    }

    async function startCapture() {
        let captureStream = null;

        try {
            captureStream = await navigator.mediaDevices.getDisplayMedia(displayMediaStreamConstraints);
        } catch (err) {
            console.error('Error: ' + err);
            status.textContent = err;
            status.className = classNames.danger;
        }

        return captureStream;
    }

    callButton.onclick = function() {
        startCapture().then(stream => {
            peer.call(conn.peer, stream);
            videoFrame.srcObject = stream;
            videoFrame.onloadedmetadata = function(e) {
                videoFrame.play();
            };
        });
    };

    initialize();
})();
