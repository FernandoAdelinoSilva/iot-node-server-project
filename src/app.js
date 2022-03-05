import Net from 'net';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getPlaceByName, getDevicesByPlace, addLogInformation } from './firebase.js'
import dotenv from 'dotenv';

dotenv.config();

console.log('========= PLACE ===============');
console.log(process.env.PLACE_NAME);

const placeInfo = await getPlaceByName(process.env.PLACE_NAME);
console.log('========= INFO ===============');
console.log(placeInfo);
const devices = await getDevicesByPlace(placeInfo.Name);

console.log('========= DEVICES ===============');
console.log(devices);
console.log('=================================');

// =================== HTTP SERVER =================================

const newHttpServer = createServer();

const httpServer = new Server(newHttpServer, {
  cors: {
    origin: `http://localhost:3000`,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: false
  }
});

newHttpServer.listen(placeInfo.ServerHttpPort, function() {
  console.log(`HTTP Server listening for connection requests on socket ${placeInfo.ServerHttpPort}`);
  console.log('=================================');
});

// =================== TCP SERVER =================================

const tcpServer = new Net.Server();

tcpServer.listen(placeInfo.ServerTcpPort, function() {
    console.log(`TCP Server listening for connection requests on socket ${placeInfo.ServerTcpPort}`);
    console.log('=================================');

});

tcpServer.on('connection', function(clientSocket) {
  const address = clientSocket.remoteAddress.substring(7);
  console.log(`A new connection has been established with ${address}`);

  httpServer.on('connection', httpSocket => {
    httpSocket.on('message', ({ name, message }) => {
      const device = devices.find(element => element.Name === name);

      if(device) {
        console.log('Sending a message to this Device:');
        console.log(device);
        clientSocket.write(message);

        try {
          addLogInformation(device, message);
          console.log(`Message - ${message} - received from ${device.Name} - ${address}`);
        } catch (error) {
          console.log(`Message - ${message} - received, error while saving on database`);
        }
      } else {
        console.log(`Device with name - ${name} - not found, message not delivered`);
      }
    });
  });

  // The server can also receive data from the client by reading from its socket.
  clientSocket.on('data', function(message) {
    const device = devices.find(device => device.IpAddress === address);
    
    if(device) {
      try {
        addLogInformation(device, message);
        console.log(`Message - ${message} - received from ${device.Name} - ${address}`);
      } catch (error) {
        console.log(`Message - ${message} - received, error while saving on database`);
      }
    }
  });

  clientSocket.on('end', function() {
      console.log('Closing connection with the client');
  });

  clientSocket.on('error', function(err) {
      console.log(`Error: ${err}`);
  });
});