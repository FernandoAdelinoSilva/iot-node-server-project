import Net from 'net';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { getPlaceByName, getDevicesByPlace } from './firebase.js'
import dotenv from 'dotenv';

dotenv.config();

const placeInfo = await getPlaceByName(process.env.PLACE_NAME);
const devices = await getDevicesByPlace(placeInfo.Name);

// =================== TCP SERVER =================================

const server = new Net.Server();

server.listen(placeInfo.ServerTcpPort, function() {
    console.log(`TCP Server listening for connection requests on socket ${placeInfo.ServerTcpPort}`);
});

server.on('connection', function(socket) {
    console.log('A new connection has been established.');

    // Now that a TCP connection has been established, the server can send data to
    // the client by writing to its socket.
    socket.write('Hello, client.');

    // The server can also receive data from the client by reading from its socket.
    socket.on('data', function(message) {
        console.log(`Data received from TCP client: ${message.toString()}`);
        
        io.emit('message', { name: "Esp32", message: message.toString() });
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
    let device = devices.find(element => element.Name === name);
    
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
  });
});

httpServer.listen(placeInfo.ServerHttpPort, function() {
  console.log(`HTTP Server listening for connection requests on socket ${placeInfo.ServerHttpPort}`)
});