import connection from "../db/dbConnection.js"

//--------------INDEX CONTENT
function indexCategory(req, res, next) {

    //request category-->voglio mostare solo le category

    let query = ` SELECT contents.category, 
    MAX(img.url) AS category_cover 
FROM contents 
JOIN img 
ON contents.id = img.content_id 
WHERE img.is_cover = 1 
  AND contents.is_visible = 1 
GROUP BY contents.category;`

    
      //CONNECTION
    connection.query(query, (err, result) => {
        if (err) return next(err);
        return res.json({
                     total: result.length,
            results: result
        })
    })
}


//-------------------EXPORT FUNCTIONS CONTENT
export default { indexCategory}