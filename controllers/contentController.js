import connection from "../db/dbConnection.js"

//--------------INDEX CONTENT
function indexContent(req, res, next) {

    const category = req.query.category;
    const search = req.query.search;

    //request category-->voglio mostare i contents in base alle category

    let query = `SELECT contents.*, img_sub.cover_image
        FROM contents
        LEFT JOIN (
            SELECT content_id, url AS cover_image
            FROM img
            WHERE (content_id, img_position) IN (
                SELECT content_id, MIN(img_position)
                FROM img
                GROUP BY content_id
            )
        ) AS img_sub ON contents.id = img_sub.content_id
        WHERE contents.is_visible = 1`

    //CREO UN ARRAY PARAMS DOVE AGGIUNGERE le Category
    let params = []

    //FILTRI DINAMICI
    //filtro per categoria
    if (category) {
        query += " AND contents.category =?";
        params.push(category);
    }

    // filtro per titolo/categoria/tag
    if (search) {
    query += " AND (contents.category LIKE ? OR contents.title LIKE ? OR contents.tag LIKE ? OR contents.description LIKE ?)";
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm)

     }


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





//--------------SHOW CONTENT
function showContent(req, res, next) {
    const { slug } = req.params;


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
            return res.json({ error: "404 NOT FOUND", message: "Contenuto non trovato" })
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

//-------------------EXPORT FUNCTIONS CONTENT
export default { indexContent, showContent }