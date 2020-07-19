import React, {useState, useRef} from 'react';

import './App.css';
const { connect, createLocalTracks } = require('twilio-video');


function App() {

  const [roomState, setRoomState] = useState('waiting');

  const [roomData, setRoomData] = useState({
    name: '',
    room: 'new-room',
    token: ''
  });

  let currentRoom = useRef();

  const handleInputChange = (event) => {
    setRoomData({
        ...roomData,
        [event.target.name] : event.target.value
    })
  }

  const startRoom = async (event) => {
    event.preventDefault();

    console.log(`Connecting to Room: ${roomData.room}`);

    const localTracks = await createLocalTracks({
        audio: true,
        video: { width: 640 }
      })
    
    const room = await connect(roomData.token, {
          name: roomData.room,
          tracks: localTracks
        });
  
    console.log(`Connected to Room: ${room.name}`);
    setRoomState('connected');
    currentRoom.current = room;

    document.getElementById('local-media').append(localTracks[1].attach())
    
    console.log('Listen to participants...  ');
    // Attach previous Participant's Media to a <div> element.
    room.participants.forEach(participant => {
      participant.tracks.forEach(publication => {
        if (publication.track) {
          document.getElementById('remote-media').appendChild(publication.track.attach());
        }
      });

      participant.on('trackSubscribed', track => {
        document.getElementById('remote-media').appendChild(track.attach());
      });

    });

    // Attach the Participant's Media to a <div> element.
    room.on('participantConnected', participant => {
      console.log(`Participant "${participant.identity}" connected`);

      participant.tracks.forEach(publication => {
        if (publication.isSubscribed) {
          const track = publication.track;
          document.getElementById('remote-media').appendChild(track.attach());
        }
      });

      participant.on('trackSubscribed', track => {
        document.getElementById('remote-media').appendChild(track.attach());
      });
    });

    room.on('disconnected', room => {
      // Detach the local media elements
      setRoomState("waiting");
      room.localParticipant.tracks.forEach(publication => {
        const attachedElements = publication.track.detach();
        attachedElements.forEach(element => element.remove());
      });
    });

  }

  const stopRoom = () => {
    console.log(`Desconnecting to Room: ${roomData.room}`);
    currentRoom.current.disconnect();
  }
  
 
  return (
    <div className="App">

      <div className="main-container">

        <div className="room">
          <div id="remote-media"></div>  
        </div>

        <div className="settings">
          <form>
            <input placeholder="name" name="name" type="text" value={roomData.name} onChange={handleInputChange} />
            <input placeholder="room" name="room" type="text" value={roomData.room} onChange={handleInputChange}/>
            <textarea placeholder="token" name="token" value={roomData.token} onChange={handleInputChange}></textarea>
            { roomState === 'waiting' ?  
              <input type="button" onClick={startRoom} value="Conectar" /> :
              <input type="button" onClick={stopRoom} value="Desconectar" />
            }
          </form>

          <div id="local-media"></div>  
        
        </div>

      </div>

    </div>
  );
}

export default App;
