import Link from 'next/link';
import Router from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import WebTorrent from 'webtorrent-hybrid';

export default function Room(){
    
    return (
        <>
        <div class="boxContainer">
			<div class="boxes">
				<form method="post" id="formCreate" action="/createRoom">
					<h2>Create Room</h2>
					<label for="movie">
						<input name="movie" type="text" placeholder="Movie" />
					</label>
					<label for="magnet">
						<input name="magnet" type="text" placeholder="Magnet" />
					</label>
					<label for="username">
						<input name="username" type="text" placeholder="Username" />
					</label>
					<button id="but_create" type="submit" form="formCreate">Create</button>
				</form>
			</div>
			<div class="boxes">
				<form method="post" action="/joinRoom" id="formJoin">
					<h2>Join Room</h2>
					<input name="room" placeholder="Room" type="text" />
					<button id="but_join" type="submit" form="formJoin">Join</button>
				</form>
			</div>
		</div>
        </>
    );
}

export async function getServerSideProps(context) {
    return {
        props: {
            
        }
    }
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
