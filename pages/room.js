import Link from 'next/link';
import Router from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
// import WebTorrent from 'webtorrent-hybrid';

export default function Room(){
    
    return (
        <>
        
        </>
    );
}

Room.getLayout = function getLayout(page) {
    return (
        <>
        <header id='header'>
			<div className="logo">
				<Link href="/">WatchFlix</Link>
			</div>
        </header>
        {page}
        </>
    )
  }

export async function getServerSideProps(context) {
    return {
        props: {

        }
    }
}
