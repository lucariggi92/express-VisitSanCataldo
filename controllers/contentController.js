import connection from "../db/dbConnection.js"


function indexContent(req, res, next) {
    const category = req.query.category;

    let query = `SELECT contents.* , GROUP_CONCAT(img.url ORDER BY img.img_posistion ASC) AS tutte_le_foto 
    FROM db_visit_project.contents 
    INNER JOIN img 
    ON contents.id = img.content_id 
    WHERE contents.is_visible =1`

    let params = []

    if (category) {
        query += " AND contents.category =?";
        params.push(category);

    }

    query += "  GROUP BY contents.id";


    connection.query(query, params, (err, result) => {
        if (err) return next(err);
        return res.json({
            category: category || "all",
            total: result.length,
            results: result
        })
    })

}

function showContent(req, res, next) {
    const id = req.params.id;
    const query = `SELECT contents.* , GROUP_CONCAT(img.url ORDER BY img.img_posistion ASC) AS tutte_le_foto 
    FROM db_visit_project.contents 
    INNER JOIN img 
    ON contents.id = img.content_id 
    WHERE id =? 
    AND is_visible =1`;

    connection.query(query, [id], (err, results) => {
        if (err) return next(err);

        if (results.length === 0) {
            res.status(404);
            return res.json({
                error: "NOT FOUND", message: "Libro non trovato",
            })
        }

        const content = results[0];
        res.json(content);
    })

}

export default { indexContent, showContent }