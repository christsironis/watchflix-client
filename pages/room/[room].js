import Link from 'next/link';
import Script from 'next/script';
import Router from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import WebTorrent from 'webtorrent-hybrid';
import { io } from "socket.io-client";

const socket = io(process.env.SERVER, {transports: ['websocket','polling']});
export default function Room(){
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

		<div>asdlfkj</div>

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
