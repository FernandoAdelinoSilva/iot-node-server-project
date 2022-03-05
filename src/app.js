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

// =================== TCP SERVER =================================

const server = new Net.Server();

server.listen(placeInfo.ServerTcpPort, function() {
    console.log(`TCP Server listening for connection requests on socket ${placeInfo.ServerTcpPort}`);
    console.log('=================================');

});

server.on('connection', function(socket) {

    const address = socket.remoteAddress.substring(7);
    console.log(`A new connection has been established with ${address}`);

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(message) {

      // How to emit a message to web
      //io.emit('message', { name: "Esp32", message: message.toString() });
      
      const device = devices.find(device => device.IpAddress === address);
      
      if(device) {
        const logInfo = {
          DeviceName: device.Name,
          PlaceId: device.PlaceId,
          Message: message.toString(),
          DateTime: new Date()
        }

        try {
          addLogInformation(logInfo);
          console.log(`Message - ${message} - received from ${device.Name} - ${address}`);
        } catch (error) {
          console.log(`Message - ${message} - received, error while saving on database`);
        }
      }
    });

    // When the client requests to end the TCP connection with the server, the server
    // ends the connection.
    socket.on('end', function() {
        console.log('Closing connection with the client');
    });

    socket.on('error', function(err) {
        console.log(`Error: ${err}`);
    });
});

// =================== HTTP SERVER ===============================

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: `http://localhost:3000`,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: false
  }
});

io.on('connection', socket => {
  socket.on('message', ({ name, message }) => {
    const device = devices.find(element => element.Name === name);

    if(device) {
      console.log('Sending a message to this Device:');
      console.log(device);
      
      io.emit('message', { name, message })
      
      var client = new Net.Socket();
      client.connect(device.TcpPort, device.IpAddress, function() {
        console.log(`${name} Connected`);
        console.log(`Message ${message}`);
        client.write(message);
      });
      
      client.on('data', function(data) {
        console.log('Received: ' + data);
        client.destroy();
      });
      
      client.on('close', function() {
        console.log('Connection closed');
      });
    } else {
      console.log(`Device with name - ${name} - not found, message not delivered`);
    }
  });
});

httpServer.listen(placeInfo.ServerHttpPort, function() {
  console.log(`HTTP Server listening for connection requests on socket ${placeInfo.ServerHttpPort}`);
  console.log('=================================');
});