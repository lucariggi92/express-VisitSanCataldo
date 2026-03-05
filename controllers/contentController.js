import connection from "../db/dbConnection.js"

//--------------INDEX CONTENTS
function indexContent(req, res, next) {

    const category = req.query.params

    //request category-->voglio mostare i contents in base alle category
 
    let query = `SELECT contents.* , GROUP_CONCAT(img.url ORDER BY img.img_position ASC) AS tutte_le_foto 
    FROM contents 
    LEFT JOIN img 
    ON contents.id = img.content_id 
    WHERE contents.is_visible =1`
    
    //CREO UN ARRAY PARAMS DOVE AGGIUNGERE le Category
    let params = []

    //FILTRI DINAMICI
    //category
    if (category) {
        query += " AND contents.category =?";
        params.push(category);
    }
    
    query += "  GROUP BY contents.id";


    //CONNECTION
    connection.query(query, params, (err, result) => {
        if (err) return next(err);
        return res.json({
            category: category || "all",
            total: result.length,
            results: result
        })
    })
}





//--------------SHOW CONTENTS
function showContent(req, res, next) {
    const {slug} =req.params;

    
    const query = `SELECT contents.* , 
    GROUP_CONCAT(img.url ORDER BY img.img_position ASC) AS tutte_le_foto 
    FROM db_visit_project.contents 
    LEFT JOIN img 
    ON contents.id = img.content_id 
    WHERE contents.slug =? 
    AND is_visible =1
    GROUP BY contents.id`;

    connection.query(query, [slug], (err, results) => {
        if (err) return next(err);
        if (results.length === 0) {
            res.status(404);
            return res.json({error: "404 NOT FOUND", message: "Contenuto non trovato"})
        }

        console.log(results)
        const contentResults = results[0];

        //split sulle foto
        if (contentResults.tutte_le_foto) {
            contentResults.tutte_le_foto = contentResults.tutte_le_foto.split(',');
        }
        res.json(contentResults);
    })

}

//-------------------EXPORT FUNCTIONS
export default { indexContent, showContent }