const express = require('express')
const router = express.Router()
const Comment = require('./../models/comment.model')
const Beach = require('./../models/beach.model')
const mongoose = require('mongoose')
const { isLoggedIn, checkRoles } = require('./../middlewares')
const { isAdmin } = require('./../utils')
const { CDNupload } = require('./../config/file-upload.config')
const weather = require('openweather-apis');

// National list
router.get('/nacional', isLoggedIn, (req, res) => {

    Beach
        .find({ country: 'España' })
        .select("name caption city country image ")
        .then(allNationalBeaches => res.render('pages/beach/show-national', { allNationalBeaches, isAdmin: isAdmin(req.session.currentUser) }))
        .catch(err => console.log('Error!', err))
})


// International list
router.get('/internacional', isLoggedIn, (req, res) => {

    Beach
        .find({ country: { $ne: 'España' } })
        .select("name caption city country image ")
        .then(allInternationalBeaches => res.render('pages/beach/show-international', { allInternationalBeaches, isAdmin: isAdmin(req.session.currentUser) }))
        .catch(err => console.log('Error!', err))
})


// Beach info
router.get('/info/:id', isLoggedIn, (req, res) => {

    const { id } = req.params

    weather.setLang('sp');
    weather.setUnits('metric');
    // check http://openweathermap.org/appid#get for get the APPID
    weather.setAPPID("f11a4305732ef7912915f09e088cdbfd")

    Beach
        .findById(id)
        .populate('comments')
        .then(selectedBeach => {
            const location = selectedBeach.location.coordinates
            const lat = location[0]
            const long = location[1]
            console.log('------------------------', lat, long);

            weather.setCoordinate(lat, long);

            weather.getAllWeather(function (err, weather) {
                console.log(weather)
                res.render('pages/beach/details-beach', { selectedBeach, weather, isAdmin: isAdmin(req.session.currentUser) })
            })
        })
        .catch(err => console.log('Error!', err))
})


// Beach form (get)
router.get('/crear', isLoggedIn, checkRoles('ADMIN'), (req, res) => res.render('pages/beach/create-beach'))


// Beach form (post)
router.post('/crear', isLoggedIn, checkRoles('ADMIN'), CDNupload.single('image'), (req, res) => {

    const { path } = req.file
    let { name, description, city, country, caption, latitude, longitude } = req.body
    const location = {
        type: 'Point',
        coordinates: [latitude, longitude]
    }
    console.log(name, description, city, country, caption, latitude, longitude )
    console.log(location)

    Beach
        .create({ name, description, city, country, caption, image: path, location })
        .then((createdBeach) => {
            
            res.redirect(`/beach/info/${createdBeach._id}`)
        })
        .catch(err => console.log('-----------------', err))
})


// Beach edit (get) 
router.get('/editar/:id', isLoggedIn, checkRoles('ADMIN'), (req, res) => {

    const { id } = req.params

    Beach

        .findById(id)
        .then(beachInfo => res.render('pages/beach/edit-beach', beachInfo))
        .catch(err => console.log('Error!', err))
})


// Beach edit (post)
router.post('/editar/:id', isLoggedIn, checkRoles('ADMIN'), (req, res) => {

    const { id } = req.params
    const { name, description, city, country, caption, image, latitude, longitude } = req.body

    const location = {
        type: 'Point',
        coordinates: [latitude, longitude]
    }

    Beach

        .findByIdAndUpdate(id, { name, description, city, country, caption, image, location })
        .then(beachInfo => res.redirect(`/beach/info/${id}`))
        .catch(err => console.log('Error!', err))
})


// Eliminar beach
router.get('/delete/:id', (req, res) => {

    const beach_id = req.params.id

    Beach
        .findByIdAndRemove(beach_id)
        .then(() => res.redirect('/beach/nacional'))
        .catch(err => console.log('Error!', err))
})

module.exports = router