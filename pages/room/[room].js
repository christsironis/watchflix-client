import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
import { io } from "socket.io-client";
import WebTorrent from 'webtorrent-hybrid';


export default function Room({cookies}){
	const router = useRouter();
	useEffect(()=>{
		const socket = io(process.env.SERVER, {transports: ['websocket','polling']});
		setInterval(() => {
			const start = Date.now();
		  
			socket.emit("ping", () => {
			  const duration = Date.now() - start;
			  console.log("delay =",duration);
			});
		  }, 1000);
		socket.on("connect", () => { console.log(socket.id) });
		socket.on("addPlayer_room", ({ user, id, color }) => {
			console.log({ user, id, color })
			// let idExists = document.querySelector(`[socketID='${id}']`);
			// if (idExists) {
			// 	idExists.style.backgroundColor = color;
			// } else {
			// 	AddPlayer({ name: name, id: id, color: color });
			// }
		});
		socket.emit("initialize_room", { room: cookies.room, user: cookies.username },({ users, ...data}) => {
			console.log(users,data);
			localStorage.setItem("watchflix",JSON.stringify(data))
			for (const [user, { id, color }] of Object.entries(users)) {
				if (!user) continue;
				// AddPlayer({ name: user, id: id, color: color });
			}
		});
		return ()=>{
			socket.emit("leave_room", { room: cookies.room, user: cookies.username});
			// socket.disconnect();
		}
	},[]);
    return (
        <>

		<div>{router.asPath} asdlfkj</div>

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
