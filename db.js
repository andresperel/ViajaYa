const { Client } = require('pg')

const client = new Client({
 host: 'db.cvcficwkhfixestraejn.supabase.co',
 port: 5432,
 database: 'postgres',
 user: 'postgres',
 password: 'agustofachero',
 ssl: {
   rejectUnauthorized: false
 }
})

client.connect()
 .then(() => {
   console.log('Conectado a Supabase 🚀')
 })
 .catch(err => {
   console.error('Error de conexión ❌', err)
 })
