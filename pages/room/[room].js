import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
import { io } from "socket.io-client";
import WebTorrent from 'webtorrent-hybrid';


export default function Room({cookies}){
	const router = useRouter();
	const room = cookies.room;
	const username = cookies.username;
	useEffect(()=>{
		document.addEventListener('dragenter', DragEnter, true);
		document.addEventListener('dragover', DragOver, true);
		document.addEventListener('dragleave', DragLeave, true);
		document.addEventListener("drop", Drop ,true);
		const player = document.querySelector("video");
		const socket = io(process.env.NEXT_PUBLIC_SERVER, {transports: ['websocket','polling']});
		// setInterval(() => {
		// 	const start = Date.now();
		  
		// 	socket.volatile.emit("ping", room ,(time) => {
		// 		if( Math.abs(time - player.currentTime) > 1 ){
		// 			player.currentTime = time;
		// 		}
		// 		console.log(time - player.currentTime)
		// 		console.log("VideoTime= ",player.currentTime,"ServerTime= ",time)
		// 		const duration = Date.now() - start;
		// 		console.log("delay =",duration);
		// 	});
		//   }, 5000);
		player.addEventListener("pause", SendPauseEvent );
		function SendPauseEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			console.log("%cpause at "+player.currentTime,"color:red;font-size:2rem;font-weight:bold");
			socket.emit("pause",{ room: room, time: player.currentTime, user: username })
		}
		player.addEventListener("play", SendPlayEvent );
		function SendPlayEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			console.log("%cplay at "+player.currentTime,"color:green;font-size:2rem;font-weight:bold")
			socket.emit("play",{ room: room, time: player.currentTime, user: username })
		}

		socket.on("connect", () => { console.log(socket.id) });
		socket.on("timeupdate", ({ time, user }) =>{
			player.serverResp = true;
			player.currentTime = time;
		});
		socket.on("pause", ({ time, user }) =>{
			player.serverResp = true;
			player.currentTime = time;
			player.pause();
		});
		socket.on("play", ({ time, user }) =>{
			player.serverResp = true;
			player.currentTime = time;
			player.play();
		});
		socket.on("addPlayer_room", ({ user, id, color }) => {
			console.log({ user, id, color })
			// let idExists = document.querySelector(`[socketID='${id}']`);
			// if (idExists) {
			// 	idExists.style.backgroundColor = color;
			// } else {
			// 	AddPlayer({ name: name, id: id, color: color });
			// }
		});
		socket.emit("initialize_room", { room: cookies.room, user: username },({ users, ...data}) => {
			console.log(users,data);
			localStorage.setItem("watchflix",JSON.stringify(data))
			for (const [user, { id, color }] of Object.entries(users)) {
				if (!user) continue;
				// AddPlayer({ name: user, id: id, color: color });
			}
		});
		return ()=>{
			socket.emit("leave_room", { room: cookies.room, user: username});
			document.removeEventListener('dragenter', DragEnter, true);
			document.removeEventListener('dragover', DragOver, true);
			document.removeEventListener('dragleave', DragLeave, true);
			player.removeEventListener("pause", SendPauseEvent );
			player.removeEventListener("play", SendPlayEvent );
			socket.disconnect();
		}
	},[]);
    return (
        <>
		<div id="dragdropcont" className=''>
			<div id="dragdrop">Drop it here...</div>
		</div>
		<div>{router.asPath} asdlfkj</div>
		<video controls width="500px" height="500px" src="/video.mp4 "></video>
        </>
    );
}

function DragEnter(e) {
    e.stopPropagation();
	if (!e.relatedTarget) {
    	document.querySelector("#dragdropcont")?.classList.add("show");
	}
}
function DragOver(e) {
    e.stopPropagation();
    e.preventDefault();
}
function DragLeave(e) {
    e.stopPropagation();
	if (!e.relatedTarget) {
		document.querySelector("#dragdropcont")?.classList.remove("show");
	}
}
function Drop(e) {
	e.preventDefault();
	document.querySelector("#dragdropcont")?.classList.remove("show");
	const player = document.querySelector("video");

	if (e.dataTransfer.items) {
	  for (let i = 0; i < e.dataTransfer.items.length; i++) {
		console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name + " "+ e.dataTransfer.items[i].type);
		if (e.dataTransfer.items[i].type.match('^video/') ) {
			const file = e.dataTransfer.items[i].getAsFile();
			const link = URL.createObjectURL(file);
			player.src = link;
		}
		if (e.dataTransfer.files[i].name.match('.vtt$') ) {
			const file = e.dataTransfer.items[i].getAsFile();
			const track = document.createElement("track");
			track.kind = "subtitles"; 
			track.label = file.name;
			track.srclang = "en"
			track.src  = URL.createObjectURL(file);
			player.appendChild(track);
			const items = player.textTracks.length;
			for (const i = 0; i < items -1; i++) {
				player.textTracks[i].mode = 'hidden';
			}
			player.textTracks[ items - 1 ].mode = 'showing';
		}
	  }
	}
  }
export async function getServerSideProps({req, params, res}) {
	const cookie = await JSON.parse(req.cookies["watchflix"] ?? null);
	let returnCookie = {...cookie , room: params.room, error: null};
	let returnObj = {	props: { cookies: returnCookie } };

	if( !cookie?.username ){ 
		returnCookie = {...cookie , room: params.room, error: "You did't fill the username."};
		returnObj = {
			redirect: {
				destination: '/lobby',
				permanent: true,
			},
		};
	}
	const roomExists = await fetch(process.env.NEXT_PUBLIC_SERVER+"/socket/roomExists",{
		method:'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({room: params.room, username: cookie?.username}),
	});
	if(!roomExists.ok){
		returnCookie = {...cookie , room: params.room, error: await roomExists.text() };
		returnObj = {
			redirect: {
				destination: '/lobby',
				permanent: true,
			},
		};
	}
	setCookies('watchflix', JSON.stringify( returnCookie ), { req, res, maxAge: 60 * 60 * 24 });
	return returnObj;
}

Room.getLayout = function getLayout(page) {
    return         <>
        <header id='header'>
            <div className="logo">
                <Link href="/">WatchFlix</Link>
            </div>
        </header>
        {page}
    </>
}
