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
		const player = document.querySelector("video")
		const socket = io(process.env.SERVER, {transports: ['websocket','polling']});
		setInterval(() => {
			const start = Date.now();
		  
			socket.volatile.emit("ping", () => {
			  const duration = Date.now() - start;
			  console.log("delay =",duration);
			});
		  }, 10000);
		// player.addEventListener('timeupdate', SendTimeUpdataEvent);		
		function SendTimeUpdataEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			console.log("moved timeline to "+player.currentTime);
			socket.emit("timeupdate",{ room: room, time: player.currentTime, user: username })
		}
		player.addEventListener("pause", SendPauseEvent );
		function SendPauseEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			console.log("pause at "+player.currentTime);
			socket.emit("pause",{ room: room, time: player.currentTime, user: username })
		}
		player.addEventListener("play", SendPlayEvent );
		function SendPlayEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			console.log("play at "+player.currentTime)
			socket.emit("play",{ room: room, time: player.currentTime, user: username })
		}

		socket.on("connect", () => { console.log(socket.id) });
		socket.on("timeupdata", ({ time, user }) =>{
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
			player.removeEventListener("pause", SendPauseEvent );
			player.removeEventListener("play", SendPlayEvent );
			socket.disconnect();
		}
	},[]);
    return (
        <>

		<div>{router.asPath} asdlfkj</div>
		<video controls width="500px" height="500px" src="/video.mp4 "></video>
        </>
    );
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
	const roomExists = await fetch(process.env.SERVER+"/socket/roomExists",{
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
