import Navbar from './Navbar';
import Footer from './Footer';
import ToastContainer from './ToastContainer';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <Navbar />
      <ToastContainer />
      <main className="layout-main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
