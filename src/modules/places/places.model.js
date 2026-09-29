const placeModel = (place) => ({
  id:        place.id,
  name:      place.name,
  category:  place.category,
  address:   place.address,
  rating:    place.rating,
  openHours: place.openHours,
  lat:       place.lat,
  lng:       place.lng,
  distance:  place.distance || null,
  specialties: place.nearbySpecialties || [],
  reviews:   place.reviews || [],
})

const reviewModel = (review) => ({
  id:        review.id,
  userId:    review.userId,
  placeId:   review.placeId,
  rating:    review.rating,
  comment:   review.comment,
  createdAt: review.createdAt,
  user: review.user ? {
    fname: review.user.fname,
    lname: review.user.lname,
  } : null,
})

module.exports = { placeModel, reviewModel }