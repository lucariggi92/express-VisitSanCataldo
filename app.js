import express from 'express';
import contentsRouter from "./routers/contents.js"
import handleError from './middlewares/handleError.js';

const app = express();
const port = process.env.SERVER_PORT;

app.use("/api/contents", contentsRouter)

app.use(handleError)

app.listen(port, ()=>{
    console.log(`Il server è in ascolto sulla porta ${port}`)
    
});
