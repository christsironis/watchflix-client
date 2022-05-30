import Header from "../header";
import SearchBar from "../searchBar";
import React, { useEffect, useRef, useState } from "react";

export default function Layouts({ children }) {
    useEffect(()=>{
        window.onscroll = function () {
            let arrow = document.querySelector("#arrow");
            if ( document.documentElement.scrollTop > 500 ) {
                arrow.classList.add("arrowDisp");
                arrow.classList.remove("arrowDisap");
            } else {
                arrow.classList.remove("arrowDisp");
                arrow.classList.add("arrowDisap");
            }
        }
    },[]);
	return (
		<>
			<Header>
				<SearchBar />
			</Header>
			{children}
			<div id="arrow" className="arrowDisap"  onClick={()=>{ document.body.scrollIntoView({block: "start"}); }}>
				<svg viewBox="0 0 19.461 19.461">
					<path d="M19.461,14.274c0,0.168-0.061,0.33-0.18,0.445l-0.014,0.012c-0.119,0.117-0.279,0.186-0.447,0.186
                    h-4.418c-0.166,0-0.328-0.067-0.445-0.186L9.73,10.504l-4.226,4.227c-0.117,0.117-0.279,0.186-0.447,0.186H0.642
                    c-0.164,0-0.33-0.067-0.446-0.186L0.185,14.72C0.059,14.599,0,14.435,0,14.275c0-0.162,0.059-0.326,0.185-0.445l9.099-9.102
                    c0.246-0.246,0.644-0.246,0.895,0l9.103,9.101C19.398,13.942,19.461,14.11,19.461,14.274z"	/>
				</svg>
			</div>
		</>
	);
}
