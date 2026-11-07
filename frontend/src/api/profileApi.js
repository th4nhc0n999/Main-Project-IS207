import client from './axiosClient'

const result = async promise => ({...await promise,success:true,source:'api'})
export const fetchUserBookings = params => result(client.get('/me/bookings',{params}))
export const cancelUserBooking = (id,reason) => result(client.patch('/bookings/'+id+'/cancel',{reason}))
export const fetchPatientProfiles = () => result(client.get('/patient-profiles'))
export const createPatientProfile = fields => result(client.post('/patient-profiles',fields))
export const updatePatientProfile = (id,fields) => result(client.put('/patient-profiles/'+id,fields))
export const deletePatientProfile = id => result(client.delete('/patient-profiles/'+id))
export const fetchCurrentUser = () => result(client.get('/auth/me'))
export const updateCurrentUser = fields => result(client.put('/user',fields))
export const logoutUser = () => result(client.post('/auth/logout'))

export const fetchEditableProfile = id => client.get('/patient-profiles/'+id,{params:{mode:'edit'}})
