import Item from "../components/item.js";
import React, { useEffect, useReducer, useRef, useState } from "react";

export default function Movies({ json }) {
    const [ data, setData] = useState( json );
    const page = useRef(1);
    console.log("render")
	useEffect(() => {
        const observer = new IntersectionObserver( (item) => {
            item.forEach( (entry) => { if( entry.isIntersecting ) AddItems(page, observer, setData); } );
        },
        { root: null, rootMargin: "0px", threshold: 0.05 }
		);
        const last = document.querySelector("body .container .item:last-child");
        console.log("useEffect", last)
		observer.observe( last );
        return ()=>{
            observer.unobserve(last)
        }
    }, [data]);

	return (
		<>
		<div className="SectionTitle"></div>
		<div className="container">
			{data.map((item) => {
				return <Item key={item[0]} id={item[0]} title={item[1]} film={"movie"}/>;
			})}
		</div>
		<div className="lds_ripple loading hide">
			<div></div>
			<div></div>
		</div>
		</>
	);
}

async function AddItems( page, obs, dispatch, limit=18) {
    obs.unobserve(document.querySelector("body .container .item:last-child"));
    page.current+=1;

    const loader = document.querySelector(".loading");
    loader.classList.remove("hide");

	const res = await fetch( `https://backend-watchflix.herokuapp.com/api/newMovies?page=${ page.current }&limit=${limit}` );
	const json = await res.json();
    if( !json.length ){ obs.unobserve(document.querySelector("body .container .item:last-child")); return; }

    loader.classList.add("hide");
    dispatch((previous)=> [...previous,...json]);
}

export async function getServerSideProps(context) {
	const res = await fetch("https://backend-watchflix.herokuapp.com/api/newMovies?page=1&limit=20");
	const json = await res.json();
	return {
		props: {
			json: json,
		}, // will be passed to the page component as props
	};
}
