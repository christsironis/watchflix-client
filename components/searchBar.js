import { useState, useRef ,useEffect, useMemo} from 'react';
import { useRouter } from 'next/router'
import Link from 'next/link';

export default function SearchBar(){
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [resutls, setResutls] = useState([]);
	const [data,setData] = useState(false);
	const oldQuery = useRef("");
	const filteredData = useRef([]);
	const shouldWait = useRef(true);
	const TimeoutID = useRef(0);
    useMemo( ()=> { GetData(); }, [] );
	let searchData = data;
	
    async function GetData(){
        const res = await fetch('https://backend-watchflix.herokuapp.com/api/searchdata');
        const json = await res.json();
        setData(json);
    }
	const TimeoutFunc = (event) => {
		shouldWait.current = false;
		Search(event);
		shouldWait.current = true;
		TimeoutID.current = 0;
	};
	const ToggleClass = (className, boolValue)=>{
		document.querySelector("#searchCont #results").classList.toggle(className, boolValue);
	};

	function Search(event) {
		const newQuery = event.target.value.replace(/^\s+|\s+/g, ' ').replace(/^\s+/g, '');
		if( event.target.value === oldQuery.current ) {
			oldQuery.current = event.target.value;
			return;
		}
		setQuery(event.target.value);
		
		if( TimeoutID.current === 0 ){
			TimeoutID.current = setTimeout( TimeoutFunc ,1000, event);
		}else if( shouldWait.current ){
			// console.log("return");
			return
		}
		
		oldQuery.current = event.target.value;

		if( event.target.value.length > query.length && query.length!==0 && event.target.value.includes(query) ) {
			searchData = filteredData.current;
		}
		const querySplited = newQuery.split(" ");
		filteredData.current = ( newQuery.length === 0 ) ? [] : searchData.filter((item)=>{
			// if the title doesn't have one of the query words then don't drop it
			return querySplited.every(elem => (item[1].toLowerCase().includes(elem) || item[2].toLowerCase().includes(elem)));
		});
		setResutls( filteredData.current );
	}
	return <>
		<div id="searchCont">
				<div>{filteredData.current.length}</div>
			<div className="searchBar">
				<input type="search" onInput={Search} onFocus={()=>ToggleClass("hide", false)} onBlur={()=>ToggleClass("hide", true)} value={query} placeholder="Search..." />
				<div className="button">
					<svg viewBox="0 0 24 24">
						<path d="M23.111 20.058l-4.977-4.977c.965-1.52 1.523-3.322 1.523-5.251 0-5.42-4.409-9.83-9.829-9.83-5.42 0-9.828 4.41-9.828 9.83s4.408 9.83 9.829 9.83c1.834 0 3.552-.505 5.022-1.383l5.021 5.021c2.144 2.141 5.384-1.096 3.239-3.24zm-20.064-10.228c0-3.739 3.043-6.782 6.782-6.782s6.782 3.042 6.782 6.782-3.043 6.782-6.782 6.782-6.782-3.043-6.782-6.782zm2.01-1.764c1.984-4.599 8.664-4.066 9.922.749-2.534-2.974-6.993-3.294-9.922-.749z" />
					</svg>
				</div>
			</div>
			<div className='hide' id="results">
				{resutls.length===0 ? "No results": resutls.slice(0,10).map((item,index)=>{
					return <Link href={`/${item[0]}`}><a onMouseDown={()=> router.push("/"+item[0])} key={item[0]} className="searchItem"><span className='mainTitle'>{item[1]}</span><span>{item[2] ? " / "+ item[2] : "" }</span></a></Link>
				})}
			</div>
		</div>
	</>
}
