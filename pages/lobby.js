import Link from 'next/link';
import Router, { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import WebTorrent from 'webtorrent-hybrid';

export default function Lobby(){
	const server = useRef(process.env.SERVER);
	useEffect(()=>{
		const localStor = JSON.parse(localStorage.getItem("watchflix"));
		const createBut = document.querySelector(".boxContainer #but_create");
		const joinBut = document.querySelector(".boxContainer #but_join");
		document.querySelector(".boxContainer input[name='title']").value = localStor?.title || null;
		document.querySelector(".boxContainer input[name='magnet']").value = localStor?.magnet || null;
		document.querySelector(".boxContainer input[name='username']").value = localStor?.username || null;
		document.querySelector(".boxContainer input[name='room']").value = localStor?.room || null;
		createBut.addEventListener("click", CreateRoom);
		joinBut.addEventListener("click", JoinRoom);
		return ()=>{
			createBut.removeEventListener("click", CreateRoom);
			joinBut.removeEventListener("click", JoinRoom);
		}
	},[]);
	
	function CreateRoom(e){
		e.preventDefault();
		const inputs = [...document.querySelectorAll(".boxContainer .create")];
		if( inputs.every((input)=> input.value === null || input.value == "" ) ) return;
		const localStor = JSON.parse(localStorage.getItem("watchflix"));
		const formData = new FormData(document.querySelector("#room"));
		const values = Object.fromEntries(formData.entries());
		delete values["room"];
		localStorage.setItem("watchflix", JSON.stringify({...localStor , ...values }));
		console.log(server.current+"/socket/getroom")
		fetch(server.current+"/socket/getroom",{
			method:'POST',
			// redirect: 'follow',
			headers: {
				'Content-Type': 'application/json'
				// 'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: JSON.stringify({...localStor , ...values }),
		}).then(res => {console.log(res);if (res.redirected) { Router.push(res.url); }} );
		// document.querySelector(".boxContainer #room").submit();
	}
    return (
        <>
        <div className="boxContainer">
			<form method="post" id="room">
				<input name="username" className='join create' type="text" placeholder="Username" />
				<div className="boxes">
					<h2>Create Room</h2>
					<label htmlFor="title">
						<input name="title" type="text" className='create' placeholder="Movie" />
					</label>
					<label htmlFor="magnet">
						<input name="magnet" type="text" placeholder="Magnet"  className='create' />
					</label>
					<button id="but_create" type="submit" form="room">Create</button>
				</div>
				<div className="boxes">
					<h2>Join Room</h2>
					<input name="room" placeholder="Room" type="text"  className='join'/>
					<button id="but_join" type="submit" form="room">Join</button>
				</div>
			</form>
		</div>
        </>
    );
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
Lobby.getLayout = function getLayout(page) {
    return         <>
        <header id='header'>
            <div className="logo">
                <Link href="/">WatchFlix</Link>
            </div>
        </header>
        {page}
    </>
}
