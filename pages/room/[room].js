import Link from 'next/link';
import Script from 'next/script';
import Router,{ useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
import WebTorrent from 'webtorrent-hybrid';
import { io } from "socket.io-client";

const socket = io(process.env.SERVER, {transports: ['websocket','polling']});
export default function Room({cookies}){
	const router = useRouter();
	useEffect(()=>{
		setInterval(() => {
			const start = Date.now();
		  
			socket.emit("ping", () => {
			  const duration = Date.now() - start;
			  console.log(duration);
			});
		  }, 1000);
		// socket.emit("initialize_room", { room: 45695, user: "ssisi" }, (users) => {
		// 	console.log(users);
		// 	// for (const [user, { id, color }] of Object.entries(users)) {
		// 	// 	console.log(typeof user);
		// 	// 	if (user) {
		// 	// 		AddPlayer({ name: user, id: id, color: color });
		// 	// 	}
		// 	// }
		// });
		socket.on("addPlayer_room", ({ name, id, color }) => {
			let idExists = document.querySelector(`[socketID='${id}']`);
			if (idExists) {
				idExists.style.backgroundColor = color;
			} else {
				AddPlayer({ name: name, id: id, color: color });
			}
		});
		
		socket.on("eraseUser", ({ user, id }) => {
			console.log(`User ${user} erased`);
			let elem = document.querySelector(`[socketID='${id}']`);
			document.querySelector(`.players`).removeChild(elem);
		});

		return ()=>{
			socket.disconnect();
		}
	},[]);
    return (
        <>

		<div>{router.asPath} asdlfkj</div>

        </>
    );
}

function CreateRoom(e){
	e.preventDefault();
	const inputs = [...document.querySelectorAll(".boxContainer .create")];
	if( inputs.every((input)=> input.value === null || input.value == "" ) ) return;
	const localStor = JSON.parse(localStorage.getItem("watchflix"));
	const formData = new FormData(document.querySelector("#room"));
	const values = Object.fromEntries(formData.entries());console.log(values)
	localStorage.setItem("watchflix", JSON.stringify({...localStor , ...values }));
	document.querySelector(".boxContainer #room").submit();
}
function JoinRoom(e){
	e.preventDefault();
	const inputs = [...document.querySelectorAll(".boxContainer .join")];
	if( inputs.every((input)=> input.value === null || input.value == "" ) ) return;
	const formData = new FormData(document.querySelector("#room"));
	const values = Object.fromEntries(formData.entries());console.log(values)
	localStorage.setItem("watchflix", JSON.stringify({...localStor , ...values }));
	document.querySelector(".boxContainer #room").submit();
}

export async function getServerSideProps({req, params, res}) {
	const cookie = JSON.parse(req.cookies.watchflix ?? null);
	console.log(cookie)
	if( !cookie || !cookie?.room || cookie?.room != params.room ){ 
		// console.log(res)
		// setCookies('watchflix', JSON.stringify({...cookie , room: params.room }), { req, res, maxAge: 60 * 60 * 24 });
		res.setHeader('location', '/lobby')
		res.setHeader('redirected', true)
		res.end()
		return {props:{}}
	}
	console.log(req.cookies)
	return {
		props: {
			cookies: cookie
		},
	};
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
