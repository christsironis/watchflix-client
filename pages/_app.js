import '../styles/global.css';
import '../styles/index.css';
import '../styles/film.css';
import Layout from '../components/layouts/Layout';

function MyApp({ Component, pageProps }) {
  console.log(Component.getLayout)
  if(Component.getLayout){
    return Component.getLayout();
  }else{
    return   <Layout>
              <Component {...pageProps} />
            </Layout>
  }
}

export default MyApp
