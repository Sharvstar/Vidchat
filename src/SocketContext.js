import React, { createContext , useState , useRef , useEffect } from 'react' ;
import { io } from 'socket.io-client'
import Peer from 'simple-peer'

const SocketContext = createContext();

const socket = io('http://localhost:5000');

const ContextProvider = ({ children })=> {
    const [stream, setstream] = useState(null);
    const [me, setMe] = useState('');
    const [call, setcall] = useState({});
    const [callAccepted, setcallAccepted] = useState(false);
    const [callEnded, setcallEnded] = useState(false) ;
    const [name, setname] = useState('') ;

    const myVideo = useRef(); //Returns an object called current
    const userVideo = useRef();
    const connectionRef = useRef() ;
    useEffect(() =>{
        navigator.mediaDevices.getUserMedia({video:true , audio:true})
            .then((currentStream)=>{
                setstream(currentStream);
                myVideo.current.srcObject = currentStream ;
                //myVideo.play();
            });
            socket.on('me' , (id) => setMe(id)) ;

            socket.on('calluser' , ({from , name:callerName , signal }) => {
                setcall({isReceivedcall:true , from , name:callerName , signal});
            })
    } , [])

    const answercall = () => {
        setcallAccepted(true) ;
        const peer  = new Peer({ initiator : false , trickle: false , stream}); 
        //Since we r answering the call that means we are not initating we pass the current stream that we set to the state stream
        peer.on('signal' , (data) => {
            socket.emit('answercall' , {signal: data , to: call.from}) ;
        })

        peer.on('stream' , (currentStream) =>{
            userVideo.current.srcObject = currentStream ;
        })

        peer.signal(call.signal);

        connectionRef.current = peer ;
    }

    const callUser = (id) => {
        const peer  = new Peer({ initiator : true , trickle: false , stream}); 

        peer.on('signal' , (data) => {
            socket.emit('calluser' , {userToCall: id , signalData: data , from: me , name}) ;
        })

        peer.on('stream' , (currentStream) =>{
            userVideo.current.srcObject = currentStream ;
        })

        socket.on('callaccepted' , (signal) =>{
            setcallAccepted(true) ;
            peer.signal(signal) ;
        })

        connectionRef.current = peer ;
    }

    const leaveCall = () => {
        setcallEnded(true) ;

        connectionRef.current.destroy() ; //Stop receiving oinput from the user's camera and audio

        window.location.reload() ;
    }

    return (
        <SocketContext.Provider value={{
            call,
            callAccepted,
            callEnded,
            myVideo,
            userVideo,
            stream,
            name,
            me,
            setname,
            callUser,
            leaveCall,
            answercall,
        }}>
            {children}
        </SocketContext.Provider>
    )
}

export { ContextProvider, SocketContext };