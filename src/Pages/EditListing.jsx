import {useState, useEffect, useRef} from 'react'
import {getAuth, onAuthStateChanged} from 'firebase/auth'
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL, 
} from 'firebase/storage'
import {doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import {db} from '../firebase.config'
import {useNavigate, useParams} from 'react-router-dom'
import { toast } from 'react-toastify'
import {v4 as uuidv4} from 'uuid'
import Spinner from '../Components/Spinner'

function EditListing () {
    // eslint-disable-next-line
const [geoLocationEnabled, setGeoLocationEnabled] = useState (true)
const [loading, setLoading] = useState (false) 
const [listing, setListing] = useState (false) 
const [formData, setFormData] = useState({

    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0
})

const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountedPrice,
    images,
    latitude,
    longitude,
} = formData

const auth = getAuth()
const navigate = useNavigate()
const params = useParams()
const isMounted = useRef(true)

// Redirect if listing is not user's
useEffect(() => {
    if(listing && listing.userRef !== auth.currentUser.uid){
        toast.error('You can not edit that listing')
        navigate('/')
    }
})

// Fetch listing to edit
useEffect(() => {
    setLoading(true)
    const fetchListing = async () => {
        const docRef = doc(db, 'listings', params.listingId)
        const docSnap = await getDoc(docRef)
        if(docSnap.exists()) {
            setListing(docSnap.data())
            setFormData({...docSnap.data(), address:docSnap.data().location})
            setLoading(false)
        } else {
            navigate('/')
            toast.error('Listing does not exist')
        }
    }

    fetchListing()
},[params.listingId, navigate])


// Sets useRef to logged in user
useEffect(() => {
    if(isMounted) {
        onAuthStateChanged(auth, (user) => {
            if(user) {
                setFormData({...formData, userRef: user.uid})
            } else {
                navigate('/sign-in')
            }
        })
    }
     return () => {
        isMounted.current = false
    }
 
}, [isMounted])

const onSubmit = async (e) => {
    e.preventDefault()

    if(discountedPrice >= regularPrice){
        setLoading(false)
        toast.error('Discounted price needs to be less than regular price')
        return
    }

    if(images.length > 6) {
        setLoading(false)
        toast.error('Max 6 images')
        return
    }

    let geoLocation = {}
    let location 

    if(geoLocationEnabled) {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${address}$key=${process.env.REACT_APP_GEOCODDE_API_KEY}`
        )

        const data = await response.json()

        geoLocation.lat = data.results[0]?.geometry.location.lat ?? 0
        geoLocation.lng = data.results[0]?.geometry.location.lng ?? 0

        location = 
        data.status === 'ZERO_RESULTS' ? undefined : data.results[0]?.formatted_address

        if(location === undefined || location.incluudes('undefined')){
            setLoading(false)
            toast.error('Please enter a correct address')
            return
        }
    } else {
        geoLocation.lat = latitude
        geoLocation.lng = longitude
        
    }

    // Store image in firebase
    const storeImage = async (image) => {
        return new Promise ((resolve, reject) =>{
            const storage = getStorage()
            const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`

            const storageRef = ref(storage, 'images/' + fileName)

            const uploadTask = uploadBytesResumable(storageRef, image)

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                    console.log('Upload is ' + progress + '% done')
                    switch (snapshot.state) {
                        case 'paused':
                        console.log('Upload is paused')
                        break
                        case 'running':
                            console.log('Upload is running')
                            break
                            default:
                                break
                    }
                },
                (error) => {
                    reject(error)
                }, () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=> {
                        resolve(downloadURL)
                    })
                }
            )
        })
    }

    const imgUrls = await Promise.all(
        [...images].map((image) => storeImage(image))
    ).catch(()=> {
        setLoading (false)
        toast.error('images not uploaded')
        return
    })

    const formDataCopy = {
        ...formData,
        imgUrls,
        // geolocation,
        timestamp: serverTimestamp(),
    }

    formDataCopy.location = address
    delete formDataCopy.images
    delete formDataCopy.address
    location && (formDataCopy.location = location)
    !formDataCopy.offer && delete formDataCopy.discountedPrice

    // Update listing
    const docRef = doc(db, 'listings', params.listingId)
    await updateDoc(docRef, formDataCopy)
    setLoading(false)
    toast.success('Listing saved')
    navigate(`/category/${formDataCopy.type}/${docRef.id}`) 
}

const onMutate = (e) => {
    let boolean = (e) => {

        if(e.target.value === 'true') {
        boolean = true
    }
    if(e.target.value === 'false'){
        boolean = false
    }

    // Files
    if(e.target.files){
        setFormData((prevState) =>({
            ...prevState,
            images: e.target.files
        }))
    }
    }
    

    // Text/Booleans/Numbers
    if(!e.target.files) {
        setFormData((prevState) =>({
            ...prevState, [e.target.id] : boolean ?? e.target.value
        }))
    }
}

if (loading)

   return <div className='profile'>
    <header>
        <p className="pageHeader">Edit Listing</p>
    </header>
    
    <main>
        <form onSubmit={onSubmit}>
            <label className='formLabel'>
            Sell / Rent
            </label>
            <div className="formButtons">
                <button type='button' className={type === 'sale' ? 'formButtonActive' : 'formButton'}  id='type' value='sale' onClick={onMutate}>
                    Sell
                </button>

                <button type='button' className={type === 'rent' ? 'formButtonActive' : 'formButton'}  id='type' value='rent' onClick={onMutate}>
                    Rent
                </button>
            </div>

            <label className='formLabel'>Name</label>
            <input className='formInputName' type='text' id='name' value={name} onChange={onMutate} maxLength='32' minLenght='10' required/>

        <div>
            <label className='formLabel'>Bedrooms</label>
            <input className='formInputSmall' type='number' id='bedrooms' value={bedrooms} onChange={onMutate} maxLength='1' minLenght='50' required/>

            <div>
                <label className='formLabel'>Bathrooms</label>
                <input className='formInputSmall' type='number' id='bathrooms' value={bathrooms} onChange={onMutate} maxLength='1' minLenght='50' required/>
            </div>
        </div>

        <label className='formLabel'>Parking Spot</label>
                <div className='formButtons'>
                    <button
                    className={parking ? 'formButtonActive' : 'formButton'} type='button' id='parking' value={true} onClick={onMutate} maxLength='50' minLenght='1'>
                        Yes 
                    </button>

                    <button
                    className={!parking && parking !== null ? 'formButtonActive' : 'formButton'} type='button' id='parking' value={false} onClick={onMutate}>
                        No 
                    </button>
                </div>

                <label className='formLabel'>Furnished</label>
                <div className="formButtons">
                    <button className={furnished ? 'formButtonActiive' : 'formButton'} type='button'id='furnished' value={true} onClick={onMutate}>Yes</button>

                    <button
                    className={!furnished && furnished !== null ? 'formButtonActive' : 'formButton'} type='button' id='furnished' value={false} onClick={onMutate}>
                        No 
                    </button>
                </div>

                <label className='formLabel'>Address</label>
                <textarea className='formInputAddress' type='text' id='address' value={address} onChange={onMutate} required/>

                {!geoLocationEnabled && (
                <div className='formLatting flex'>
                    <div>
                    <label className='formLabel'>Latitude</label>
                    <input className='formInputSmall' type='number' id='latitude' value={latitude} onChange={onMutate} required />
                    </div>
                          
                    <div>
                    <label className='formLabel'>Longitude</label>
                    <input className='formInputSmall' type='number' id='longitude' value={longitude} onChange={onMutate} required />
                    </div>
                </div> 
                )}

                <label className='formLabel'>Offer</label>
                <div className="formButtons">
                    <button className={offer ? 'formButtonActiive' : 'formButton'} type='button'id='offer' value={true} onClick={onMutate}>Yes</button>

                    <button
                    className={!offer && offer !== null ? 'formButtonActive' : 'formButton'} type='button' id='offer' value={false} onClick={onMutate}>
                        No 
                    </button>
                </div>

                <label className='formLabel'>Regular Price</label>
                <div>
                <input className='formInputSmall' type='number' id='regularPrice' value={regularPrice} onChange={onMutate} maxLength='75,0000000' minLenght='50' required/>
                {type === 'rent' && 
                    <p className='formPriceText'>$ / Month</p>}
                </div>

                {offer && (
                    <>
                        <label className='formLabel'>Discounted Price</label>
                        <input className='formInputSmall' type='number' id='DiscountedPrice' value={discountedPrice} onChange={onMutate} maxLength='75,0000000' minLenght='50' required={offer} />
                    </>
                )}

                <label className='formLabel'>Images</label>
                        <p className='imagesInfo'>The first images will be the cover (max 6).</p>
                        <input className='formInputFile' type='file' id='images' onChange={onMutate} maxLength='6' accept='.jpg, .png, .jpeg' multiple required/>

                <button type='submit' className="primaryButton EditListingButton">
                    Edit Listing
                </button>
        </form>
    </main>
   </div>
}

export default EditListing