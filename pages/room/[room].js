import Link from 'next/link';
import Head from 'next/head';
import Script from 'next/script';
import toWebVTT from "srt-webvtt";
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
import { io } from "socket.io-client";
import WebTorrent from 'webtorrent';
import Webplayer from '../../components/webplayer';

export default function Room({cookies}){
	const [textTracks,setTextTracks] = useState({subsTable: {}, current: 'off'});
	const [messages,setMessages] = useState([]);
	const router = useRouter();
	const room = cookies.room;
	const username = cookies.username;
	const socket = useRef();
	let player;

	useEffect(()=>{
		socket.current = io(process.env.NEXT_PUBLIC_SERVER, { transports: ['websocket'] });
		// const webtorrent = new WebTorrent();

		player = document.querySelector("video");
		// setInterval(() => {
		// 	socket.current.volatile.emit("timedifferencev1",new Date().toISOString().slice(0,-1));
		// }, 5000);
		// setInterval(() => {
		// 	socket.current.volatile.emit("timedifferencev2",Date.now());
		// }, 5000);

		setInterval(() => {
			const start =Date.now();

			// socket.current.volatile.emit("ping", room ,(serverTime, dateEmited) => {
			// 	const totalDelay = Date.now() - start;
			// 	const serverDelay = Date.now() - dateEmited;
			// 	console.log(" totalDelay= ",totalDelay," serverDelay= ", serverDelay, " mycustomTime ",new Date().toISOString().slice(0,-1));

			// 	serverTime = ( serverTime  /1000).toFixed(3);
			// 	// if( serverTime < 0){ serverTime = 0; }
			// 	console.log("VideoTime= ",player.currentTime,"ServerTime= ",serverTime)
			// 	document.querySelector("#ping").innerHTML = " \n VideoTime= <span style='color:red;'>"+player.currentTime+" </span> \nServerTime= <span style='color:red;'> "+serverTime+"</span>"+" <p>totalDelay= "+ totalDelay+"</p>";
				
			// 	if( !player.paused && Math.abs(serverTime - player.currentTime) > 0.5 ){
			// 		player.currentTime = serverTime;
			// 		console.log("%csyncing with server","color:yellow;font-size:2rem;font-weight:bold");
			// 	}
			// 	// console.log(time - player.currentTime)
			// 	console.log("delay =",totalDelay);
			// });
		}, 5000);
		player.addEventListener("pause", SendPauseEvent );
		function SendPauseEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			socket.current.emit("pause",{ room: room, videoTime: player.currentTime*1000, user: username, dateEmited: Date.now()})
			console.log("%cpause at "+player.currentTime,"color:red;font-size:2rem;font-weight:bold");
		}
		player.addEventListener("play", SendPlayEvent );
		function SendPlayEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			socket.current.emit("play",{ room: room, videoTime: player.currentTime*1000, user: username, dateEmited: Date.now() })
			player.pause();
			player.serverResp = true;
			console.log("%cplay at "+player.currentTime,"color:green;font-size:2rem;font-weight:bold")
		}

		socket.current.on("pause", ({ videoTime, user }) =>{
			player.serverResp = true;
			player.currentTime = videoTime / 1000;
			player.pause();
		});
		socket.current.on("play", ({ videoTime, dateEmited, user }) =>{
			// const dateNow =Date.now();
			// const emitionDelay = dateNow - dateEmited;
			player.serverResp = true;
			player.currentTime = videoTime / 1000;
			player.play();
		});
		socket.current.on("addPlayer_room", ({ user, id, color }) => {
			console.log({ user, id, color })
			// let idExists = document.querySelector(`[socketID='${id}']`);
			// if (idExists) {
			// 	idExists.style.backgroundColor = color;
			// } else {
			// 	AddPlayer({ name: name, id: id, color: color });
			// }
		});
		socket.current.on("newMessage", ({user,text}) => {
			setMessages(previous=> { return [ {user,text}, ...previous]  });
		});
		socket.current.on("addSub", ({name,url,language,isoLang}) => {
			AddSubTrack( name, url, isoLang, language, true );
		});
		socket.current.emit("initialize_room", { room: cookies.room, user: username },({ users, subs}) => {
			console.log(users,subs);
			for (const code in subs) {
				for (const sub in subs[code]) {
					AddSubTrack( subs[code][sub].name, subs[code][sub].url, subs[code][sub].isoLang, subs[code][sub].language );
				}
			}
			// console.log(webtorrent)
			// webtorrent.add(data.magnet, function (torrent) {
			// 	// Got torrent metadata!
			// 	console.log('Client is downloading:', torrent.infoHash)
			  
			// 	torrent.files.forEach(function (file) {
			// 	  // Display the file by appending it to the DOM. Supports video, audio, images, and
			// 	  // more. Specify a container element (CSS selector or reference to DOM node).
			// 	  file.appendTo('body')
			// 	})
			// })
			for (const [user, { id, color }] of Object.entries(users)) {
				if (!user) continue;
				// AddPlayer({ name: user, id: id, color: color });
			}
		});
		document.addEventListener('dragenter', DragEnter, true);
		document.addEventListener('dragover', DragOver, true);
		document.addEventListener('dragleave', DragLeave, true);
		document.addEventListener("drop", Drop,true);

		return ()=>{
			socket.current.emit("leave_room", { room: cookies.room, user: username});
			socket.current.disconnect();
			document.removeEventListener('dragenter', DragEnter, true);
			document.removeEventListener('dragover', DragOver, true);
			document.removeEventListener('dragleave', DragLeave, true);
			document.removeEventListener("drop", Drop ,true);
			player.removeEventListener("pause", SendPauseEvent );
			player.removeEventListener("play", SendPlayEvent );
		}
	},[]);

	async function FindSubs(){
		const subsCont = document.querySelector(".subscontainer");
		subsCont.classList.toggle("showFlex");
		if(!subsCont.classList.contains("showFlex")) return;
		const storage = await JSON.parse(localStorage.getItem("watchflix"));
		let data = "";
		if( storage.type === "serie" ){
			data = `&season=${storage.season}&episode=${storage.episode}`;
		}
		const request = await fetch(`/api/subs?id=${storage.imdbID}${data}`);
		const json = await request.json();
		subsCont.innerHTML = "";
	
		for(let item of Object.keys(json).sort()){
			for(let sub of json[item]){
				subsCont.innerHTML += `<div class="sub" data-fileID="${sub.attributes.files[0].file_id}" language="${sub.langName}" language-iso="${sub.attributes.language}" data-url="${sub.attributes.url}"><span class="subLang">${sub.langName}</span><span class="subName">${sub.attributes.release}</span></div>` 
			}
		}
		for(let item of document.querySelectorAll(".subscontainer .sub")){
			item.addEventListener("click",async ()=>{
				const request = await fetch(`/api/subs?download=${item.getAttribute("data-fileid")}`);
				const json = await request.json();
				AddSubTrack( json.name, json.link, item.getAttribute("language-iso"), item.getAttribute("language"), true);
				// console.log("sub added from opensubs: ",json);
				socket.current.emit("addSub",{ room: room,name: json.name, url: json.link, language: item.getAttribute("language"), isoLang: item.getAttribute("language-iso")});
			});
		}
	}
	function AddSubTrack( name, url, isoLang = "undefined", language = "undefined", setActive= false){
		setTextTracks(previous=> { return { subsTable: {...previous.subsTable, [url]: {name: name, url: url, isoLang: isoLang, language: language}}, current: setActive ? url : previous.current } });
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
	async function Drop(e) {
		e.preventDefault();
		document.querySelector("#dragdropcont")?.classList.remove("show");
		if (e.dataTransfer.items) {
			for (let i = 0; i < e.dataTransfer.items.length; i++) {
				console.log(e.dataTransfer.items[i]);
				console.log(e.dataTransfer.files);
				const file = e.dataTransfer.items[i].getAsFile();
				  console.log('... file[' + i + '].name = ' + file.name + " "+ e.dataTransfer.items.type);
				if (file.type.match('^video/') && !file.name.match('.mkv$')) {
					const link = URL.createObjectURL(file);
					player.src = link;
				}
				else if (file.name.match('.webvtt$') || file.name.match('.vtt$')) {
					AddSubTrack( file.name, URL.createObjectURL(file),'','', true );
					UploadSub(file);
				}
				else if(file.name.match('.srt$') ){
					const textTrackUrl = await toWebVTT(file);
					AddSubTrack( file.name.replace('.srt','.webvtt'), textTrackUrl,'','', true );
					UploadSub(file);
				}
				else{
					alert("Doesn't support file type!");
				}
			  }
		}
	}
	function UploadSub(file){
		let formdata = new FormData();
		formdata.append(room, file, file.name );

		fetch( process.env.NEXT_PUBLIC_SERVER+"/api/upload", { 
			method: 'POST', 
			body: formdata } ).
		then((response) => response.json()).then(res=>console.log(res));
	}

    return (
        <>
		<Head>
			<title>{cookies.room}</title>
			<meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests"/> 
		</Head>
		<div id="dragdropcont" className=''>
			<div id="dragdrop">Drop it here...</div>
		</div>
		<div>Room: {room}</div>
		<div id="ping"></div>
		<div id="offset"></div>
		<video crossOrigin="anonymous" controls width="500px" height="500px" src="/video.mp4 "></video>
        <Webplayer socket={socket} room={room} user={username} messages={messages} subtitles={textTracks} setSubtitles={setTextTracks}/>
		<button id='subsbutton' onClick={()=>FindSubs()}>Find Subs</button>
		<div className="subscontainer">	</div>
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
	const roomExists = await fetch(process.env.NEXT_PUBLIC_SERVER+"/api/roomExists",{
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
