const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    typeInscription: { type: String, enum: ['nouvelle', 'renouvellement', 'mutation'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDate: { type: Date, required: true },
    gender: { type: String, enum: ['M', 'F'], required: true },
    contact: {
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },
    tutor: {
        name: String,
        phone: String,
        email: String
    },
    address: {
        city: String,
        postalCode: String,
        fullAddress: String
    },
    documents: {
        carteIdentite: String,
        justificatifDomicile: String,
        certificatMedical: String,
    },
    droitImage: { type: String, enum: ['oui', 'non'] },
    codePromo: { type: String } ,
    status: { type: String, enum: ['refusé', 'attente', 'accepté'], default: 'attente' }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);