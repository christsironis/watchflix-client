import Link from 'next/link';
import { useRouter } from 'next/router'

export default function Header({children}){
	const router = useRouter();
    return <>
        <header id='header'>
			<div className="logo">
				<Link href="/">WatchFlix</Link>
			</div>
			<div className="cont">
				<div className="menu">
					<Link href="/"><a className={`${ router.asPath === "/" ? 'current' : ''} menuItem`}>Home</a></Link>
					<Link href="/movies"><a className={`${ router.asPath === "/movies" ? 'current' : ''} menuItem`}>Movies</a></Link>
					<Link href="/series"><a className={`${ router.asPath === "/series" ? 'current' : ''} menuItem`}>Series</a></Link>
				</div>
				{children}
			</div>
		</header>
    </>
}