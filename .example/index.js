const { Transform } = require('stream')
const fs = require('fs')
const { CQWebSocket, Channel } = require('..')

const socket = new CQWebSocket({
  port: 7700
})

/* connection 1 */
const connection = await socket.open(Channel.API)
// connection

/* connection 2 */
socket.on('open', (connection) => {
  connection.on('message', (msg) => {
    connection.call('send_msg', msg)
      .on('response', (resp) => {
        console.log(resp.retcode)
      })
  })

  connection.on('close', () => {
    
  })
})

socket.open()

const connection = await socket.open(Channel.API)
for await (const msg of connection) {
  const resp = await connection.call('send_msg', msg)
  console.log(resp.retcode)
}

const stringify = new Transform({
  writableObjectMode: true,
  readableObjectMode: false,
  transform (chunk, _, callback) {
    callback(null, JSON.stringify(chunk) + '\n')
  }
})

connection.pipe(stringify)
  .pipe(fs.createWriteStream('events.dat', 'utf8'))
const {} = require('util')