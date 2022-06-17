import Link from 'next/link';
import Router,{ useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
// import WebTorrent from 'webtorrent-hybrid';

export default function Lobby(){
	const router = useRouter();
	const cookie = JSON.parse(getCookie("watchflix") ?? null);
	useEffect(()=>{
		const localStor = JSON.parse(localStorage.getItem("watchflix") ?? null);
		const createBut = document.querySelector(".boxContainer #but_create");
		const joinBut = document.querySelector(".boxContainer #but_join");
		document.querySelector(".boxContainer input[name='title']").value = localStor?.title || null;
		document.querySelector(".boxContainer input[name='magnet']").value = localStor?.magnet || null;
		document.querySelector(".boxContainer input[name='username']").value = cookie?.username || null;
		document.querySelector(".boxContainer input[name='room']").value = cookie?.room || null;
		createBut.addEventListener("click", CreateRoom);
		joinBut.addEventListener("click", JoinRoom);
		return ()=>{
			createBut.removeEventListener("click", CreateRoom);
			joinBut.removeEventListener("click", JoinRoom);
		}
	},[]);
	async function CreateRoom(e){
		e.preventDefault();
		const localStor = JSON.parse(localStorage.getItem("watchflix") ?? null);
		const formData = new FormData(document.querySelector("#room"));
		const values = Object.fromEntries(formData.entries());
	
		const res = await fetch(process.env.SERVER+"/socket/createRoom",{
			method:'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({...localStor , ...values }),
		});
		const data = await res.text();
		if(res.ok){
			setCookies('watchflix', {...localStor, room: data}, { maxAge: 60 * 60 * 24 }) 
			router.push("/room/"+data); 
		}else{
			alert(data);
			return;
		}
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

async function JoinRoom(e){
	e.preventDefault();
	const localStor = await JSON.parse(getCookie("watchflix"));
	const formData = new FormData(document.querySelector("#room"));
	const values = Object.fromEntries(formData.entries());

	const res = await fetch(process.env.SERVER+"/socket/joinRoom",{
		method:'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({...localStor , ...values }),
	});
	const data = await res.text();
	if(res.ok){
		setCookies('watchflix', {...localStor, room: data}, { maxAge: 60 * 60 * 24 }) 
		Router.push("/room/"+data); 
	}else{
		alert(data);
		return;
	}
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
