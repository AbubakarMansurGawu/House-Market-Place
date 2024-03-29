import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'
import {ToastContainer} from 'react-toastify'
import {Toastify}  from 'react-toastify/dist/ReactToastify.css'
import Navbar from './Components/Navbar'
import PrivateRoute from './Components/PrivateRoute'
import Explore from './Pages/Explore'
import Offers from './Pages/Offers'
import Category from './Pages/Category'
import Profile from './Pages/Profile'
import SignIn from './Pages/SignIn'
import SignUp from './Pages/SignUp'
import ForgotPassword from './Pages/ForgotPassword'
import CreateListing from './Pages/CreateListing'
import EditListing from './Pages/EditListing'
import Listing from './Pages/Listing'
import Contact from './Pages/Contact'


function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path='/' element={<Explore/>} />
        <Route path='/offers' element={<Offers/>} />
        <Route path='/category/:categoryName' element={<Category/>} />
        <Route path='/profile' element={<Profile/>} />
        <Route path='/sign-in' element={<SignIn/>} />
        <Route path='/sign-up' element={<SignUp/>} />
        <Route path='/forgot-password' element={<ForgotPassword/>} />
        <Route path='/create-listing' element={<CreateListing/>} />
        <Route path='/edit-listing/:listingsId' element={<EditListing/>} />
        <Route path='/category/:categoryName/:listingId' element={<Listing/>} />
        <Route path='/contact/:landlordId' element={<Contact/>} />
      </Routes>
     <Navbar/>
    </Router>
     
     <ToastContainer/>
    </>
  );
}

export default App;
