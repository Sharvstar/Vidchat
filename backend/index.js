const app = require('express')();
const server = require('http').createServer(app);
const cors = require('cors');

const port = 5000 ;

const io = require('socket.io')(server , {
    cors:{
       origin:"*",
       methods: ["GET" , "POST"] 
    }
    });


    app.use(cors()) ;


    app.get('/' , (req,res)=>{
        res.send("This app is running on "+port);
    })


    io.on('connection' , (socket) => {
        socket.emit('me' , socket.id) ;

        socket.on('disconnect' , ()=>{
            socket.broadcast.emit("call ended") ;
        });

        socket.on('calluser' , ({usertocall , signalData , from , name}) =>{
            io.to(usertocall).emit("calluser" , {signal:signalData , from , name});
        });

        socket.on("answercall" , (data) =>{
            io.to(data.to).emit("callaccepted" , data.signal) ;
        })
    });

    server.listen(port , ()=>{console.log("Server running on port "+port)}) ;