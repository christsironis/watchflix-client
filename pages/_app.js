import '../styles/global.css';
import '../styles/index.css';
import '../styles/film.css';
import '../styles/room.css';
import Layout from '../components/layouts/Layout';

function MyApp({ Component, pageProps }) {
  if(Component.getLayout instanceof Function){
    return Component.getLayout(<Component {...pageProps} />);
  }
  else{
    return  <>
      <Layout>
        <Component {...pageProps} />
      </Layout></>
  }
}

export default MyApp
