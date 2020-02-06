(() => {
    const recvIdInput = document.getElementById('receiver-id');
    const status = document.getElementById('status');
    const connectButton = document.getElementById('connect-button');
    const videoFrame = document.getElementById('remote-video');

    const classNames = {
        success: 'alert alert-success',
        warning: 'alert alert-warning',
        danger: 'alert alert-danger'
    };

    let peer = null; // own peer object
    let lastPeerId = null;
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
        });
        peer.on('disconnected', () => {
            status.textContent = 'Connection lost. Please reconnect';
            status.className = classNames.danger;

            console.warn('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });
        peer.on('close', () => {
            conn = null;
            status.textContent = 'Connection destroyed. Please refresh';
            status.className = classNames.danger;

            console.warn('Connection destroyed');
        });
        peer.on('error', err => {
            status.textContent = err;
            status.className = classNames.danger;
            console.log(err);
        });
        peer.on('call', call => {
            call.answer();
            call.on('stream', stream => {
                setTimeout(() => {
                    videoFrame.srcObject = stream;
                    videoFrame.onloadedmetadata = function(e) {
                        videoFrame.play();
                    };
                }, 1500);
            });
        });
    }

    /**
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
    function join() {
        // Close old connection
        if (conn) {
            conn.close();
        }

        // Create connection to destination peer specified in the input field
        conn = peer.connect(recvIdInput.value, {
            reliable: true
        });

        conn.on('open', () => {
            status.textContent = 'Connected to: ' + conn.peer;
            status.className = classNames.success;

            console.log('Connected to: ' + conn.peer);
        });
        conn.on('close', () => {
            status.textContent = 'Connection closed';
            status.className = classNames.warning;
            conn = null;
        });
    }

    // Start peer connection on click
    connectButton.addEventListener('click', join);

    // Since all our callbacks are setup, start the process of obtaining an ID
    initialize();
})();
