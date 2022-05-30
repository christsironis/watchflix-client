import Item from "../components/item.js"
import React, { useEffect, useRef, useState, useReducer } from 'react';

export default function Series({json}){
    const [ data, dispatch] = useReducer( reducer, json );
    const page = useRef(1);

	useEffect(() => {
        const observer = new IntersectionObserver( (item) => {
            item.forEach( (entry) => { if( entry.isIntersecting ) AddItems(page, observer, dispatch); } );
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
            {data.map((item)=> {
                return <Item key={item[0]} id={item[0]} title={item[1]} film={"serie"}/>
            })}
        </div>
        <div className="lds-ripple loading hide">
            <div></div>
            <div></div>
        </div>
        </>
    );
}
function reducer(state, action) {
    return [...state,...action];
}
async function AddItems( page, obs, dispatch, limit=18) {
    obs.unobserve(document.querySelector("body .container .item:last-child"));
    page.current+=1;

    const loader = document.querySelector(".loading");
    loader.classList.remove("hide");

	const res = await fetch( `https://backend-watchflix.herokuapp.com/api/newSeries?page=${ page.current }&limit=${limit}` );
	const json = await res.json();
    if( !json.length ){ obs.unobserve(document.querySelector("body .container .item:last-child")); return; }

    loader.classList.add("hide");
    dispatch(json);
}

export async function getStaticProps() {
    const res = await fetch('https://backend-watchflix.herokuapp.com/api/newSeries?page=1&limit=20');
    const json = await res.json();
    return {
      props: {
          json: json
      }, // will be passed to the page component as props
    }
  }