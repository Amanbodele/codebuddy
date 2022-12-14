import React, { useState, useRef, useEffect } from "react";
import Client from "../Component/Client";
import Editor from "../Component/Editor";
import { initSocket } from "../socket.js";
import ACTIONS from "../Actions";
import {
  useLocation,
  useParams,
  useNavigate,
  Navigate,
} from "react-router-dom";
import toast from "react-hot-toast";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClient] = useState([]);
  useEffect(() => {
    // console.log("swaraj");
    setClient([]);
    const init = async () => {
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("socket connection failed , try again later..");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
            console.log("Aman",socketId);
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room .`);
            console.log(`${username}`);
          }
          setClient(clients);
          // console.log(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE,{
            code: codeRef.current,
            socketId,
          })
        }
      );
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.error(`${username} left the room .`);
        setClient((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
   
    return () => {
      socketRef.current.disconnect();
      socketRef.current.off(ACTIONS.JOINED); 
      socketRef.current.off(ACTIONS.DISCONNECTED);
    }
  }, []);
  

 async function copyRoomId () {
      try {
          await navigator.clipboard.writeText(roomId);
          toast.success('room id has beeen copied to your clipboard...')
      } catch(err){
          toast.error('could not copy room id...');
    console.log('error',err);
      }
    }
  function leaveRoom (){
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src="/code-sync.png" alt="logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>Copy ROOM ID</button>
        <button className="btn leaveBtn" onClick={leaveRoom}>leave</button>
      </div>
      <div className="editorWrap">
        <Editor socketRef = {socketRef} roomId =  {roomId} onCodeChange={(code)=>
        {
          codeRef.current=code;
        }}/>
      </div>
    </div>
  );
};

export default EditorPage;
