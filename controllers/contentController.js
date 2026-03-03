 import connection from "../db/dbConnection.js"


function index(req, res, next){
    const query = "SELECT * FROM contents"

    connection.query(query, (err, result)=>{
        if(err) return next(err);
        return res.json({
            results:result
        })
    })

}

function show(req, res, next){
    const id = req.params.id;
    const query = "SELECT * FROM `contents` WHERE `id`=?";

    connection.query(query, [id], (err, results)=>{
        if(err) return next(err);

        if(results.length ===0){
            res.status(404);
            return res.json({
                error:"NOT FOUND", message:"Libro non trovato",
            })
        }

        const content = results[0];
        res.json(content);
    })

}

export default {index, show}