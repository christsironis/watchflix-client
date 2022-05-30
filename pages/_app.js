import '../styles/global.css';
import '../styles/index.css';
import '../styles/film.css';
import Layout from '../components/layouts/Layout';

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page)
  return getLayout(
    <Layout>
        <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp
