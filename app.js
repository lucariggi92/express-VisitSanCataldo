import express from 'express';

const app = express();
const port =3000;

app.listen(port, function(){
    console.log(`Il server è in ascolto sulla porta ${port}`)
});
