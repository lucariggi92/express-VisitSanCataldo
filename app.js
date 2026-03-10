import express from 'express';
import contentsRouter from "./routers/contents.js"
import notFound from "./middlewares/notFound.js"
import itinerariesRouter from "./routers/itineraries.js"
import categoriesRouter from "./routers/categories.js"
import handleError from './middlewares/handleError.js';

const app = express();
const port = process.env.SERVER_PORT;

app.use("/api/contents", contentsRouter)
app.use("/api/itineraries", itinerariesRouter)
app.use("/api/categories", categoriesRouter)

app.use(notFound)
app.use(handleError)

app.listen(port, ()=>{
    console.log(`Il server è in ascolto sulla porta ${port}`)
    
});
